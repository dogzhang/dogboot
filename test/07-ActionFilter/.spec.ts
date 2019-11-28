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

test('GlobalActionFilter', async function () {
    {
        let resp = await request(server).get('/home/index')
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home/index').set({ ticket: 'admin' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('ActionFilter-on-controller', async function () {
    {
        let resp = await request(server).get('/home1/index')
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home1/index1')
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home1/index').set({ ticket: 'admin' })
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home1/index1').set({ ticket: 'admin' })
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home1/index').set({ ticket: 'admin1' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).get('/home1/index1').set({ ticket: 'admin1' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('ActionFilter-on-action', async function () {
    {
        let resp = await request(server).get('/home2/index')
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home2/index1')
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home2/index').set({ ticket: 'admin' })
        expect(resp.status).toBe(401)
    }
    {
        let resp = await request(server).get('/home2/index1').set({ ticket: 'admin' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).get('/home2/index').set({ ticket: 'admin1' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).get('/home2/index1').set({ ticket: 'admin1' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})