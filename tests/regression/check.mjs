import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { computed, ref, watch } from 'vue'
import { readPngHeader } from '../../src/utils/png.js'
import { readJpegHeader } from '../../src/utils/jpeg.js'
import { imageChannels, projectChannels } from '../../src/utils/channels.js'
import { useChannels } from '../../src/composables/useChannels.js'
import { useLevels } from '../../src/composables/useLevels.js'
import { normalizeLevels, gammaMarker, markerGamma, buildLUT, computeHistogram } from '../../src/utils/levels.js'
globalThis.ImageData = class { constructor(data, width, height) { this.data = data; this.width = width; this.height = height } }
let passed = 0
async function test(name, run) { await run(); passed++; console.log(`✓ ${name}`) }
const file = bytes => new Blob([new Uint8Array(bytes)])
function png(type, depth, trns) {
  const head = new Uint8Array(33); head.set([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82]); head[24] = depth; head[25] = type
  const chunk = trns ? [0,0,0,trns.length,116,82,78,83,...trns,0,0,0,0] : []
  return file([...head,...chunk,0,0,0,0,73,69,78,68,0,0,0,0])
}
for (const [type, depths, samples] of [[0,[1,2,4,8,16],1],[2,[8,16],3],[3,[1,2,4,8],1],[4,[8,16],2],[6,[8,16],4]]) {
  for (const depth of depths) await test(`PNG type ${type}, ${depth} bits`, async () => {
    const info = await readPngHeader(png(type, depth))
    assert.equal(info.colorDepth, depth * samples)
    assert.equal(info.hasAlpha, [4,6].includes(type))
    assert.equal(info.channels, [0,4].includes(type) ? samples : type === 6 ? 4 : 3)
    assert.equal(info.isGrayscale, [0,4].includes(type))
  })
}
await test('Palette alpha only for actual tRNS transparency', async () => {
  assert.equal((await readPngHeader(png(3,4,[255,255]))).hasAlpha, false)
  const info = await readPngHeader(png(3,4,[255,0]))
  assert.equal(info.hasAlpha,true); assert.equal(info.channels,4); assert.equal(info.colorDepth,4)
})
for (const type of [0,2]) await test(`tRNS type ${type}`, async () => {
  const info = await readPngHeader(png(type,8,[0,0]))
  assert.equal(info.hasAlpha,true); assert.equal(info.channels,type===0?2:4)
  assert.equal(info.colorDepth,type===0?8:24)
})
await test('Reject truncated and invalid PNG headers', async () => {
  assert.equal(await readPngHeader(file([1,2,3])),null)
  await assert.rejects(readPngHeader(file([137,80,78,71,13,10,26,10])))
  await assert.rejects(readPngHeader(png(2,4)))
})
for (const count of [1,3]) await test(`JPEG ${count} components`, async () => {
  const info = await readJpegHeader(file([255,216,255,192,0,8,8,0,1,0,1,count,255,217]))
  assert.equal(info.channels,count); assert.equal(info.colorDepth,count*8)
})
const source = new Uint8ClampedArray([30,90,150,80,60,60,60,255])
await test('RGB channels switch independently, preserve original', () => {
  const original = source.slice()
  assert.deepEqual([...projectChannels(source,['r','g','b','a'],{r:true,g:false,b:true,a:true})].slice(0,4),[30,0,150,80])
  assert.deepEqual([...projectChannels(source,['r','g','b','a'],{a:true})].slice(0,4),[80,80,80,255])
  assert.deepEqual([...projectChannels(source,['r','g','b','a'],{})].slice(0,4),[0,0,0,255])
  assert.deepEqual(source,original)
})
await test('Gray switches all color components and alpha-only is a mask', () => {
  const gray = new Uint8ClampedArray([60,60,60,80])
  assert.deepEqual([...projectChannels(gray,['gray','a'],{gray:false,a:true})],[80,80,80,255])
  assert.deepEqual([...projectChannels(gray,['gray','a'],{gray:false,a:false})],[0,0,0,255])
  assert.deepEqual([...projectChannels(gray,['gray','a'],{gray:true,a:false})],[60,60,60,255])
})
await test('Channel availability and state reset on a new document', () => {
  const info=ref({isGrayscale:true,hasAlpha:true}), data=ref(new ImageData(new Uint8ClampedArray([60,60,60,80]),1,1))
  const state=useChannels(data,info)
  assert.deepEqual(state.availableChannels.value,['gray','a'])
  state.toggle('gray'); assert.equal(state.displayData.value.data[0],80)
  info.value={isGrayscale:false,hasAlpha:false}
  assert.deepEqual(state.availableChannels.value,['r','g','b'])
  assert.deepEqual(state.channels.value,{r:true,g:true,b:true})
  state.toggle('a'); assert.equal(state.channels.value.a,undefined)
  assert.deepEqual(imageChannels(null),[])
})
await test('Levels boundaries, nonfinite and fractional values', () => {
  const levels=useLevels()
  for (const channel of ['master','r','g','b','a']) {
    levels.activeChannel.value=channel; levels.setWhite(100); levels.setBlack(250)
    assert.equal(levels.current.value.black,99)
    levels.setWhite(-10); assert.equal(levels.current.value.white,100)
    for (const v of [NaN,Infinity,-100,999,0.5]) {
      levels.setBlack(v); levels.setWhite(v); levels.setGamma(v)
      const s=levels.current.value
      assert.ok(s.black>=0 && s.black<s.white && s.white<=255)
      assert.ok(Number.isInteger(s.black) && Number.isInteger(s.white))
      assert.ok(s.gamma>=0.1 && s.gamma<=9.9)
    }
  }
})
await test('Middle marker stays between endpoints and LUT matches gamma', () => {
  for (const gamma of [0.1,0.5,1,2,9.9]) {
    const marker=gammaMarker(20,210,gamma)
    assert.ok(marker>20 && marker<210)
    assert.ok(Math.abs(markerGamma(20,210,marker)-gamma)<1e-8)
    assert.equal(buildLUT(20,210,gamma)[20],0)
    assert.equal(buildLUT(20,210,gamma)[210],255)
  }
  assert.ok(Object.values(normalizeLevels(NaN,NaN,NaN)).every(Number.isFinite))
})
await test('All Vue components compile', () => {
  for (const name of ['App.vue', ...readdirSync(new URL('../../src/components/',import.meta.url)).map(v=>'components/'+v)]) {
    if (!name.endsWith('.vue')) continue
    const text=readFileSync(new URL('../../src/'+name,import.meta.url),'utf8')
    const {descriptor,errors}=parse(text); assert.deepEqual(errors,[])
    const script=compileScript(descriptor,{id:name})
    const result=compileTemplate({source:descriptor.template.content,filename:name,id:name,compilerOptions:{bindingMetadata:script.bindings}})
    assert.deepEqual(result.errors,[],name)
  }
})
await test('Level fields restore clamped value even when state does not change', () => {
  const text=readFileSync(new URL('../../src/components/LevelsDialog.vue',import.meta.url),'utf8')
  const {descriptor}=parse(text), levels=useLevels()
  const script=descriptor.scriptSetup.content.replace(/^import .*$/gm,'')
  const create=new Function('computed','ref','watch','defineProps','defineEmits','computeHistogram','gammaMarker','markerGamma',script+'\nreturn {onBlackInput,onWhiteInput,onGammaInput,onMiddleInput}')
  const handlers=create(computed,ref,watch,()=>({levels,imageInfo:{isGrayscale:false,hasAlpha:true}}),()=>()=>{},computeHistogram,gammaMarker,markerGamma)
  levels.setWhite(100)
  for (let n=0;n<2;n++) { const e={target:{value:'999'}}; handlers.onBlackInput(e); assert.equal(e.target.value,'99') }
  const e={target:{value:'0'}}; handlers.onWhiteInput(e); assert.equal(e.target.value,'100')
})
await test('Real PNG fixtures contain expected depth and channels', async () => {
  for (const [name, depth, count] of [['gray-1.png',1,1],['gray-16.png',16,1],['gray-alpha-8.png',16,2],['rgb-8.png',24,3],['rgba-8.png',32,4],['rgba-16.png',64,4],['palette-4.png',4,3],['palette-alpha-4.png',4,4],['rgb-trns-8.png',24,4]]) {
    const info=await readPngHeader(new Blob([readFileSync(new URL('./fixtures/'+name,import.meta.url))]))
    assert.equal(info.colorDepth,depth,name); assert.equal(info.channels,count,name)
  }
})
console.log(`Passed ${passed} regression checks`)
