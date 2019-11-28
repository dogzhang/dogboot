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

test('not-typed', async function () {
    let resp = await request(server).post('/home/index').send({ name: ' a ' })
    expect(resp.status).toBe(200)
    expect(resp.text).toBe(' a ')
})

test('typed-trim-strings', async function () {
    let resp = await request(server).post('/home/index1').send({ name: ' a ' })
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('a')
})

test('typed-trim-strings-before-validation', async function () {
    let resp = await request(server).post('/home/index2').send({ name: ' a ' })
    expect(resp.status).toBe(500)
})