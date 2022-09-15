import './dotenv.js'
import os from 'os'
import cluster from 'cluster'
import {createApp} from './app.js'

const cpus = os.cpus().length
const clusterWorkerSize = process.env.CLUSTER_LIMIT
  ? Math.min(process.env.CLUSTER_LIMIT, cpus)
  : cpus

if(clusterWorkerSize > 1) {
  if(cluster.isMaster) {
    for(let i = 0; i < clusterWorkerSize; i++) {
      cluster.fork()
    }
    cluster.on('exit', worker => {
      console.log(`Worker ${worker.id} has exited`)
    })
  }
  else {
    createApp()
  }
}
else {
  createApp()
}
