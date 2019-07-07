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

test('BindQuery', async function () {
    let resp = await request(server).get('/home/index?a=1')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('BindPath', async function () {
    {
        let resp = await request(server).get('/home/index1/1/b')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('1')
    }
    {
        let resp = await request(server).get('/home/index1/1')
        expect(resp.status).toBe(404)
    }
})

test('BindBody', async function () {
    let resp = await request(server).post('/home/index2').send({ a: '1' })
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('BindContext', async function () {
    let resp = await request(server).get('/home/index3?a=1')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('BindRequest', async function () {
    let resp = await request(server).get('/home/index4?a=1')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('BindResponse', async function () {
    let resp = await request(server).get('/home/index5')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})