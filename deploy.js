const tonweb = new window.TonWeb()

const cheque_code = 'B5EE9C72410102010045000114FF00F4A413F4BCF2C80B01006CD33331D0D3030171B0915BE0FA4030ED44D0D3FF3002F90112BAF2E06470208016C8CB055003CF1621FA0212CB6ACB00C98100A0FB008408884A'
const code = tonweb.boc.Cell.oneFromBoc(cheque_code)

async function hashText (text) {
    const textBuffer = new TextEncoder().encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', textBuffer)
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

window.onload = (event) => {
    var buf = new Uint8Array(20)
    crypto.getRandomValues(buf)
    $('#password')[0].value = tonweb.utils.bytesToBase64(buf)
}