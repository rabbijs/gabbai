#!/usr/bin/env node

const dotenv = require('dotenv');

const argv = require('yargs').argv

import { Actor, log, getConnection } from 'rabbi';

const publicIp = require('public-ip');

const systemInfo = require('systeminformation')

const INTERVAL = 60000;

(async () => {


  try {

    let defaultEnvironmentPath = '/etc/gabbai/gabbai.env';

    if (require('fs').existsSync(defaultEnvironmentPath)) {

      log.info(`loading .env configuration from ${defaultEnvironmentPath}`);

      dotenv.config({ path: defaultEnvironmentPath });
    }

  } catch(err) {

    console.error(err)

    dotenv.config();
  }

  const ip = await publicIp.v4();

  const amqp = await getConnection();

  const channel = await amqp.createChannel();

  let actor = Actor.create({
  
    exchange: 'rabbi',
    
    routingkey: 'gabbai.ping',

    queue: `rabbi.gabbai.ping:${ip}`

  })
  .start(async (channel, msg, json) => {

    channel.ack(msg);

  });

  log.info('gabbai.started', ip);

  let interval = setInterval(async () => {

    await publishSystemInfo(channel);

  }, INTERVAL);

  await publishSystemInfo(channel);

})()

async function publishSystemInfo(channel) {

  let cpu = await systemInfo.cpu();
  let mem = await systemInfo.mem();
  let fs = await systemInfo.fsSize();
  let docker = await systemInfo.dockerAll();
  let network = await systemInfo.networkInterfaces();
  let ip = await publicIp.v4();

  const message = JSON.stringify({
    ip,
    cpu,
    mem,
    fs,
    docker,
    network
  });

  console.log(message);

  channel.publish('rabbi', 'gabbai.systeminfo', Buffer.from(message));

  log.info(`gabbai.systeminfo.published`);

}

