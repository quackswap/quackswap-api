import dotenv from 'dotenv';

if(process.env.NODE_ENV.trim() === 'development') {
  dotenv.config({path: `${process.cwd()}/.env.development`});
}
