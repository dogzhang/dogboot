import { Server } from 'http';
import * as request from 'supertest';

import { DogBootApplication } from '../../bin';
import { containerPromise } from './src/app';

let server: Server

beforeAll(async function () {
    let container = await containerPromise
    server = container.getComponentInstance(DogBootApplication).server
})

afterAll(function () {
    server.close()
})

test('no-cache', async function () {
    let resp1 = await request(server).get('/home/index')
    let resp2 = await request(server).get('/home/index')
    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp1.text).not.toBe(resp2.text)
})

test('name-specified', async function () {
    let resp1 = await request(server).get('/home1/index')
    let resp2 = await request(server).get('/home1/index')
    let resp3 = await request(server).get('/home1/index?id=1')
    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp3.status).toBe(200)
    expect(resp1.text).toBe(resp2.text)
    expect(resp1.text).toBe(resp3.text)
})

test('name-specified-and-keys-specified', async function () {
    let resp1 = await request(server).get('/home2/index?id=1')
    let resp2 = await request(server).get('/home2/index?id=1')
    let resp3 = await request(server).get('/home2/index?id=3')
    let resp4 = await request(server).get('/home2/index?id=3')
    let resp5 = await request(server).get('/home2/index?id=1')
    let resp6 = await request(server).get('/home2/index?id=1')

    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp3.status).toBe(200)
    expect(resp4.status).toBe(200)
    expect(resp5.status).toBe(200)
    expect(resp6.status).toBe(200)

    expect(resp1.text).toBe(resp2.text)
    expect(resp1.text).not.toBe(resp3.text)
    expect(resp3.text).toBe(resp4.text)
    expect(resp1.text).toBe(resp5.text)
    expect(resp1.text).toBe(resp6.text)
})

test('keys-by-child-field', async function () {
    let resp1 = await request(server).post('/home3/index').send({ id: 1 })
    let resp2 = await request(server).post('/home3/index').send({ id: 1 })
    let resp3 = await request(server).post('/home3/index').send({ id: 2 })
    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp3.status).toBe(200)
    expect(resp1.text).toBe(resp2.text)
    expect(resp1.text).not.toBe(resp3.text)
})

test('keys-by-child-fields', async function () {
    let resp1 = await request(server).post('/home4/index').send({ type: { id: 1 } })
    let resp2 = await request(server).post('/home4/index').send({ type: { id: 1 } })
    let resp3 = await request(server).post('/home4/index').send({ type: { id: 2 } })
    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp3.status).toBe(200)
    expect(resp1.text).toBe(resp2.text)
    expect(resp1.text).not.toBe(resp3.text)
})

test('mutil-keys', async function () {
    let resp1 = await request(server).post('/home5/index?id=1').send({ a: { id: 1 } })
    let resp2 = await request(server).post('/home5/index?id=1').send({ a: { id: 1 } })
    let resp3 = await request(server).post('/home5/index?id=2').send({ a: { id: 1 } })
    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp3.status).toBe(200)
    expect(resp1.text).toBe(resp2.text)
    expect(resp1.text).not.toBe(resp3.text)
})

test('maxAge-specified', async function () {
    let resp1 = await request(server).get('/home6/index')
    let resp2 = await request(server).get('/home6/index')
    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp1.text).toBe(resp2.text)

    await new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve()
        }, 500)
    })

    let resp3 = await request(server).get('/home6/index')
    expect(resp3.status).toBe(200)
    expect(resp1.text).not.toBe(resp3.text)
})

test('clear-cache', async function () {
    let resp1 = await request(server).get('/home7/index')
    let resp2 = await request(server).get('/home7/index')
    expect(resp1.status).toBe(200)
    expect(resp2.status).toBe(200)
    expect(resp1.text).toBe(resp2.text)

    let resp3 = await request(server).get('/home7/clear')
    expect(resp3.status).toBe(200)

    let resp4 = await request(server).get('/home7/index')
    expect(resp1.text).not.toBe(resp4.text)

    let resp5 = await request(server).get('/home7/index')
    let resp6 = await request(server).get('/home7/index')
    expect(resp5.status).toBe(200)
    expect(resp6.status).toBe(200)
    expect(resp5.text).toBe(resp6.text)
})