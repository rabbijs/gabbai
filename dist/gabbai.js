#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require('dotenv');
const argv = require('yargs').argv;
const rabbi_1 = require("rabbi");
const publicIp = require('public-ip');
const systemInfo = require('systeminformation');
const INTERVAL = 60000;
(() => __awaiter(this, void 0, void 0, function* () {
    try {
        let defaultEnvironmentPath = '/etc/gabbai/gabbai.env';
        if (require('fs').existsSync(defaultEnvironmentPath)) {
            rabbi_1.log.info(`loading .env configuration from ${defaultEnvironmentPath}`);
            dotenv.config({ path: defaultEnvironmentPath });
        }
    }
    catch (err) {
        console.error(err);
        dotenv.config();
    }
    const ip = yield publicIp.v4();
    const amqp = yield rabbi_1.getConnection();
    const channel = yield amqp.createChannel();
    let actor = rabbi_1.Actor.create({
        exchange: 'rabbi',
        routingkey: 'gabbai.ping',
        queue: `rabbi.gabbai.ping:${ip}`
    })
        .start((channel, msg, json) => __awaiter(this, void 0, void 0, function* () {
        channel.ack(msg);
    }));
    rabbi_1.log.info('gabbai.started', ip);
    let interval = setInterval(() => __awaiter(this, void 0, void 0, function* () {
        let cpu = yield systemInfo.cpu();
        let mem = yield systemInfo.mem();
        let fs = yield systemInfo.fsSize();
        let docker = yield systemInfo.dockerAll();
        let network = yield systemInfo.networkInterfaces();
        const message = JSON.stringify({
            ip,
            cpu,
            mem,
            fs,
            docker,
            network
        });
        channel.publish('rabbi', 'gabbai.systeminfo', Buffer.from(message));
        rabbi_1.log.info(`gabbai.systeminfo.published`);
    }), INTERVAL);
}))();
//# sourceMappingURL=gabbai.js.map