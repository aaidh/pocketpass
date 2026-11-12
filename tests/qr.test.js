import test from 'node:test';
import assert from 'node:assert/strict';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

test('QR generation and image decoding preserve fuel code content',()=>{
 const payload='https://fuel.example/pass?id=ABC-1234&token=a%2Fb%3D';
 const qr=QRCode.create(payload,{errorCorrectionLevel:'M'});
 const scale=6,margin=4,size=(qr.modules.size+margin*2)*scale;
 const pixels=new Uint8ClampedArray(size*size*4).fill(255);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const mx=Math.floor(x/scale)-margin,my=Math.floor(y/scale)-margin;
  const black=mx>=0&&my>=0&&mx<qr.modules.size&&my<qr.modules.size&&qr.modules.get(my,mx);
  if(black){const offset=(y*size+x)*4;pixels[offset]=pixels[offset+1]=pixels[offset+2]=0;}
 }
 assert.equal(jsQR(pixels,size,size)?.data,payload);
});
