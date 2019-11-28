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

test('NotNull', async function () {
    {
        let resp = await request(server).post('/home/index1')
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index1').send({ a: null })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index1').send({ a: 1 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('NotEmpty', async function () {
    {
        let resp = await request(server).post('/home/index2')
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index2').send({ a: null })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index2').send({ a: '' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index2').send({ a: 1 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('NotBlank', async function () {
    {
        let resp = await request(server).post('/home/index3')
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index3').send({ a: null })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index3').send({ a: '' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index3').send({ a: ' ' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index3').send({ a: 1 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Length', async function () {
    {
        let resp = await request(server).post('/home/index4')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index4').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index4').send({ a: '' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index4').send({ a: 'a'.repeat(3) })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index4').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index4').send({ a: 12345 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index4').send({ a: 12 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('MinLength', async function () {
    {
        let resp = await request(server).post('/home/index5')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: '' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: 'a'.repeat(3) })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: 12 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('MaxLength', async function () {
    {
        let resp = await request(server).post('/home/index5')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: '' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: 'a'.repeat(3) })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index5').send({ a: 1234 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Range', async function () {
    {
        let resp = await request(server).post('/home/index7')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index7').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index7').send({ a: '' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index7').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index7').send({ a: 5 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index7').send({ a: 2 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Min', async function () {
    {
        let resp = await request(server).post('/home/index8')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index8').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index8').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index8').send({ a: 2 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Max', async function () {
    {
        let resp = await request(server).post('/home/index9')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index9').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index9').send({ a: 5 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index9').send({ a: 2 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Decimal', async function () {
    {
        let resp = await request(server).post('/home/index10')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index10').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index10').send({ a: '' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index10').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index10').send({ a: 1.00001 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index10').send({ a: 1.01 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('MinDecimal', async function () {
    {
        let resp = await request(server).post('/home/index11')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index11').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index11').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index11').send({ a: 1.01 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('MaxDecimal', async function () {
    {
        let resp = await request(server).post('/home/index12')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index12').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index12').send({ a: 1.00001 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index12').send({ a: 1.01 })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Reg', async function () {
    {
        let resp = await request(server).post('/home/index13')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index13').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index13').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index13').send({ a: 'a1' })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index13').send({ a: 'a' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})

test('Func', async function () {
    {
        let resp = await request(server).post('/home/index14')
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index14').send({ a: null })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
    {
        let resp = await request(server).post('/home/index14').send({ a: 1 })
        expect(resp.status).toBe(500)
        expect(resp.text).toBe('IllegalArgumentException')
    }
    {
        let resp = await request(server).post('/home/index14').send({ a: 'admin' })
        expect(resp.status).toBe(200)
        expect(resp.text).toBe('ok')
    }
})