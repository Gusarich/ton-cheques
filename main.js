const tonweb = new window.TonWeb()
const nacl = TonWeb.utils.nacl

const cheque_code = 'te6ccgEBBAEARwABFP8A9KQT9LzyyAsBAgEgAgMABNIwAF7ygwjXGO1E0NP/MCH5AUAz+RDyovgAcCCAEMjLBVADzxYh+gISy2rLAMmBAKD7AA=='
const code = tonweb.boc.Cell.oneFromBoc(tonweb.utils.bytesToHex(tonweb.utils.base64ToBytes(cheque_code)))

async function hashText (text) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', tonweb.utils.base64ToBytes(text))
    return new Uint8Array(hashBuffer)
}

async function deployCheque (address, stateInit, value) {
    await ton.send('ton_sendTransaction', [{
        value: value.toString(),
        to: address.toString(true, true, false, false),
        stateInit: tonweb.utils.bytesToBase64(await stateInit.toBoc(false))
    }])
}

async function createCheque () {
    const key = $('#key')[0].value
    const value = tonweb.utils.toNano($('#value')[0].value)

    const keyPair = nacl.sign.keyPair.fromSecretKey(tonweb.utils.base64ToBytes(key))
    
    var data = new tonweb.boc.Cell()
    data.bits.writeBytes(keyPair.publicKey)

    var stateInit = new tonweb.boc.Cell()
    stateInit.bits.writeBit(0)
    stateInit.bits.writeBit(0)
    stateInit.bits.writeBit(1)
    stateInit.bits.writeBit(1)
    stateInit.bits.writeBit(0)
    stateInit.refs.push(code)
    stateInit.refs.push(data)

    const stateInitHash = await stateInit.hash()
    const address = new tonweb.Address(0 + ':' + tonweb.utils.bytesToHex(stateInitHash))

    await deployCheque(address, stateInit, value)
}

async function claimCheque () {
    const address = $('#address')[0].value
    const key = $('#key')[0].value

    const keyPair = nacl.sign.keyPair.fromSecretKey(tonweb.utils.base64ToBytes(key))
    const myAddress = (await ton.send('ton_requestAccounts'))[0]

    var body = new tonweb.boc.Cell()
    body.bits.writeAddress(new tonweb.Address(myAddress))
    console.log(body)
    
    const bodyHash = await body.hash()
    const signature = nacl.sign.detached(bodyHash, keyPair.secretKey)
    console.log(signature)
    
    var bodySigned = new tonweb.boc.Cell()
    bodySigned.bits.writeBytes(signature)
    bodySigned.writeCell(body)

    console.log(bodySigned)

    var msg = new tonweb.boc.Cell()
    msg.bits.writeUint(2, 2)
    msg.bits.writeAddress(undefined)
    msg.bits.writeAddress(new tonweb.Address(address))
    msg.bits.writeCoins(0)
    msg.bits.writeBit(0)
    msg.bits.writeBit(1)
    msg.refs.push(bodySigned)

    console.log(msg)

    await tonweb.sendBoc(
        await msg.toBoc(false)
    )
}

window.onload = (event) => {
    window.onLoadFunction()
}