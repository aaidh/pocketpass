import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePass,loadWalletConfig} from '../server/pass.js';
import {createApp} from '../server/app.js';
const valid={title:'My fuel pass',holder:'',reference:'ABC-1234',payload:' original QR / unchanged ',color:'forest',category:'fuel'};
test('preserves the exact encoded QR value',()=>assert.equal(validatePass(valid).payload,valid.payload));
test('rejects missing, oversized and invalid pass details',()=>{
 for(const change of [{payload:''},{payload:'é'.repeat(901)},{title:'\nBad'},{color:'__proto__'},{category:'bank'},{holder:42}])assert.throws(()=>validatePass({...valid,...change}));
});
test('missing signing credentials do not report Wallet as ready',()=>assert.equal(loadWalletConfig({}),null));
test('API reports setup state, validates requests and rejects foreign origins',async()=>{
 const server=createApp(null,{allowedOrigin:'https://example.com'}).listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 try{const base=`http://127.0.0.1:${server.address().port}`;
 assert.deepEqual(await (await fetch(`${base}/api/status`)).json(),{walletReady:false});
 assert.equal((await fetch(`${base}/api/passes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(valid)})).status,503);
 assert.equal((await fetch(`${base}/api/passes`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,400);
 assert.equal((await fetch(`${base}/api/status`,{headers:{Origin:'https://foreign.example'}})).status,403);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
