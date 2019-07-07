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

test('default', async function () {
    let resp = await request(server).get('/home/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('use-default-path', async function () {
    let resp = await request(server).get('/home/index1')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('async', async function () {
    let resp = await request(server).get('/home/index2')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('method-not-matched', async function () {
    let resp = await request(server).get('/home/index3')
    expect(resp.status).toBe(404)
})

test('PostMapping', async function () {
    let resp = await request(server).post('/home/index3')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('PutMapping', async function () {
    let resp = await request(server).put('/home/index4')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('PatchMapping', async function () {
    let resp = await request(server).patch('/home/index5')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('DeleteMapping', async function () {
    let resp = await request(server).delete('/home/index6')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('HeadMapping', async function () {
    let resp = await request(server).head('/home/index7')
    expect(resp.status).toBe(200)
    expect(resp.text).toBeUndefined()
})

test('AllMapping', async function () {
    {
        let resp = await request(server).get('/home/index8')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index8')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).put('/home/index8')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).patch('/home/index8')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).delete('/home/index8')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).head('/home/index8')
        expect(resp.status).toBe(200)
        expect(resp.text).toBeUndefined()
    }
})

test('without-decorator', async function () {
    let resp = await request(server).get('/home/index9')
    expect(resp.status).toBe(404)
})

test('Mapping', async function () {
    {
        let resp = await request(server).get('/home/index10')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).get('/home/index11')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Mapping-uppercase', async function () {
    {
        let resp = await request(server).get('/home/index12')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})