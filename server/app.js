import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import { createPass, validatePass } from './pass.js';

export function createApp(config=null,{allowedOrigin=process.env.ALLOWED_ORIGIN}={}) {
 const app=express();app.disable('x-powered-by');
 app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.path.startsWith('/api/')){
   res.setHeader('Cache-Control','no-store');
   const origin=req.headers.origin;
   if(origin && allowedOrigin && origin!==allowedOrigin)return res.status(403).json({error:'This origin is not allowed.'});
   if(origin && origin===allowedOrigin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');}
   if(req.method==='OPTIONS')return res.sendStatus(204);
  }next();
 });
 app.use('/api',express.json({limit:'16kb'}));
 app.get('/api/status',(req,res)=>res.json({walletReady:Boolean(config)}));
 app.post('/api/passes',rateLimit({windowMs:60000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many passes. Try again in a minute.'}}),async(req,res)=>{
  let data;try{data=validatePass(req.body);}catch(error){return res.status(400).json({error:error.message});}
  if(!config)return res.status(503).json({error:'Apple Wallet signing is not configured yet.'});
  try{const buffer=await createPass(data,config);res.setHeader('Content-Type','application/vnd.apple.pkpass');res.setHeader('Content-Disposition','attachment; filename="pocketpass.pkpass"');res.send(buffer);}catch{res.status(500).json({error:'Could not sign the pass. Contact the site owner.'});}
 });
 app.use(express.static(fileURLToPath(new URL('../dist',import.meta.url))));
 app.use((err,req,res,next)=>res.status(err.status===413?413:400).json({error:err.status===413?'Request is too large.':'Invalid request.'}));
 return app;
}
