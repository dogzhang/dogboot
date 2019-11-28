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

test('singleton', async function () {
    let resp = await request(server).get('/home1/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('component-depends-another-component', async function () {
    let resp = await request(server).get('/home2/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('cyclic-dependence', async function () {
    let resp = await request(server).get('/home3/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('constructor', async function () {
    let resp = await request(server).get('/home4/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('Init', async function () {
    let resp = await request(server).get('/home5/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('Init-async', async function () {
    let resp = await request(server).get('/home6/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('Init-exed-after-constructor', async function () {
    let resp = await request(server).get('/home7/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ok')
})

test('DogBootApplication-can-be-get-from-DI', async function () {
    let resp = await request(server).get('/home8/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('DogBootApplication')
})

test('DIContainer-can-be-get-from-DI', async function () {
    let resp = await request(server).get('/home9/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('DIContainer')
})