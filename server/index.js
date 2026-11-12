import {createApp} from './app.js';
import {loadWalletConfig} from './pass.js';
const config=loadWalletConfig();
const port=Number(process.env.PORT || 3000);
createApp(config).listen(port,()=>console.log(`PocketPass: http://localhost:${port} | Wallet signing ${config?'ready':'not configured'}`));
