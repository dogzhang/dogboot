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
    expect(resp.text).toBe('1')
})

test('field-specified', async function () {
    let resp = await request(server).get('/home1/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('array', async function () {
    let resp = await request(server).get('/home2/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('object', async function () {
    let resp = await request(server).get('/home3/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('array-of-object', async function () {
    let resp = await request(server).get('/home4/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('Typed', async function () {
    let resp = await request(server).get('/home5/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})

test('TypedArray', async function () {
    let resp = await request(server).get('/home6/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('1')
})