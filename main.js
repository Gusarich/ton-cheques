const tonweb = new window.TonWeb()

const cheque_code = 'B5EE9C72410102010040000114FF00F4A413F4BCF2C80B010062D33331D0D30331FA4030ED44D0D3FF3002F90212BAF2E06470208010C8CB055003CF1621FA0212CB6ACB00C98100A0FB003850B03B'
const code = tonweb.boc.Cell.oneFromBoc(cheque_code)

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
    const password = $('#password')[0].value
    const value = tonweb.utils.toNano($('#value')[0].value)
    
    var data = new tonweb.boc.Cell()
    data.bits.writeBytes(await hashText(password))

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
    const password = $('#password')[0].value

    await ton.send('ton_sendTransaction', [{
        value: '10000000',
        to: address,
        data: password,
        dataType: 'base64'
    }])
}

window.onload = (event) => {
    window.onLoadFunction()
}