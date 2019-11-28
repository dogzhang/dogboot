import { Server } from 'http';
import * as request from 'supertest'
import { containerPromise } from './src/app'
import { DogBootApplication } from '../../bin';

let server: Server

beforeAll(async function () {
    let container = await containerPromise
    server = container.getComponentInstance(DogBootApplication).server
})

afterAll(function () {
    server.close()
})

test('default', async function () {
    let resp = await request(server).get('/home/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('without-decorator', async function () {
    let resp = await request(server).get('/home1/index')
    expect(resp.status).toBe(404)
})

test('use-default-path', async function () {
    let resp = await request(server).get('/home2/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})