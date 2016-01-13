ctx = document.querySelector('canvas').getContext('2d')
function drawPath(a){
  const path = new Path2D()
  path.moveTo(a[0].x, a[0].y)
  a.forEach(({x, y}) => path.lineTo(x, y))
  return path
}
const a = _.range(200).map(i => {
  return {x: i, y:10}
})
ctx.strokeStyle = 'black'
ctx.stroke(drawPath(a))

function divide(a){
  const center = Math.ceil(a.length/2)
  return [a.slice(0,center), a.slice(center, a.length)]
}

function perlin_(amp, a){
  const power = 0.5
  console.log(a, a.length)
  if(a.length <= 2){
    return a
  } else if (a.length == 1) {
    return [a[0] + _.random(amp) - amp/2]
  } else {
    var [left, right] = divide(a)
    const r = _.random(amp) - amp/2 + (left[left.length-1]+right[0])/2
    const dyLeft = (r - left[0])/left.length
    const dyRight = -(r - right[right.length-1])/right.length
    left = left.map((n, i) => (i)*dyLeft)
    right = right.map((n, i) => (i+1)*dyRight + r)
    return perlin_(amp*power, left).concat(perlin_(amp*power, right))
  }
}
function perlin(amp, size){
  const amps = powers2(amp)
  const sizes = powers2(size).map(Math.round).reverse()
  const chunks = _.zipWith(amps, sizes, white)
  return chunks.reduce((acc, chunk) => {
    return _.zipWith(chunk, double(acc), _.add)
  }, [])
}
function white(amp, size){
  return Array.apply(null, Array(size)).map(() => _.random(amp) - amp/2)
}
function intToBrightNess(i){
  const c = (Math.round(i*255)).toString(16)
  return c+c+c
}
function double(a){
  return _.flatten(a.map((n, i) => [n, (a[i+1]+n)/2]))
}
function powers2(x){
  if(x <= 1){
    return [1]
  } else {
    return [x].concat(powers2(x/2))
  }
}
const noise = perlin(100, 1000)
console.log(noise)
noise.map(i => i/200 + 0.5).forEach((i,x) => {
  ctx.fillStyle = '#'+intToBrightNess(i);
  ctx.fillRect(x,0,x,50)
})
ctx.strokeStyle = 'black'
const p = drawPath(noise.map((n,i) => ({x: i, y: 100 - n})))
ctx.stroke(p)
