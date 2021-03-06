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

test('GlobalExceptionFilter', async function () {
    let resp = await request(server).get('/home/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('error')
})

test('ExceptionFilter-on-controller', async function () {
    let resp = await request(server).get('/home1/index')
    expect(resp.status).toBe(200)
    expect(resp.text).toBe('ExceptionFilter-error')
})

test('ExceptionFilter-on-action', async function () {
    {
        let resp = await request(server).get('/home2/index')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ExceptionFilter-error')
    }
})

test('handle-mutli-Exception', async function () {
    {
        let resp = await request(server).get('/home3/index')
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home3/index').set({ ticket: 'admin' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('rank-of-mutli-ExceptionFilter-on-action', async function () {
    {
        let resp = await request(server).get('/home4/index')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('4_1ExceptionFilter-error')
    }
})

test('rank-of-mutli-ExceptionFilter-on-Controller', async function () {
    {
        let resp = await request(server).get('/home5/index')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('5_1ExceptionFilter-error')
    }
})