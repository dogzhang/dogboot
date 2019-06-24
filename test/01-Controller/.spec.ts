import { Server } from 'http';
import * as request from 'supertest'
import { appPromise } from './src/app'

let server: Server

beforeAll(async function () {
    let app = await appPromise
    server = app.server
})

afterAll(function () {
    server.close()
})

test('controller', async function () {
    let resp = await request(server).get('/home/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('controller-root-and-multi-controllrs-in-a-single-file', async function () {
    let resp = await request(server).get('')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('root')
})