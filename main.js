const BACKGROUND_COLOR = '#3E3E3E'

const TRACE_LENGTH_PARTS = 10
const TRACE_LENGTH_SKIP_STEPS = 8
const EXISTING_RADIUS_MIN = 2

const BITS_NUMBER = 200
const BITS_POSITION_RANGE = 1000
const BITS_VELOCITY_RANGE = 100
const BITS_RADIUS_RANGE_MIN = 3
const BITS_RADIUS_RANGE_MAX = 40
const FIXED_DT = 0.016

var win = window,
doc = document,
docElem = doc.documentElement,
body = doc.getElementsByTagName('body')[0],
x = win.innerWidth || docElem.clientWidth || body.clientWidth,
y = win.innerHeight|| docElem.clientHeight|| body.clientHeight;
alert(x + ' × ' + y);

const WIDTH = x
const HEIGHT = y

function start() {
  console.log('start')
  
  const canvas = initCanvas()
  const ctx = canvas.getContext('2d')
  ctx.translate(0.5, 0.5);
  // ctx.translate(0.5, 0.5);

  
  const bits = []
  for (let k = 0; k < BITS_NUMBER; k ++ ) {
    let bit = new Bit(
      new Vector2(rand(-BITS_POSITION_RANGE, BITS_POSITION_RANGE), rand(-BITS_POSITION_RANGE, BITS_POSITION_RANGE)),
      new Vector2(rand(-BITS_VELOCITY_RANGE, BITS_VELOCITY_RANGE), rand(-BITS_VELOCITY_RANGE, BITS_VELOCITY_RANGE)))

    bits.push(bit)
  }

  const simulator = new Simulation(bits)

  setInterval(() => {
    // Update step
    simulator.update(FIXED_DT)

    // Clear canvas and Apply viewport
    updateCanvas(canvas)

    // Render step
    simulator.render(ctx)
  }, FIXED_DT * 1000);
}

class Simulation {
  constructor (planets) {
    this.planets = planets || []
    
    this.quads = new Array(10)
    for (var i = 0; i < this.quads.length; i++) {
      this.quads[i] = new Array(10);
      for (var j = 0; j < this.quads[i].length; j++) {
        this.quads[i][j] = []
      }
    }

    // Seta a simulação no planeta
    this.planets.map(p => p.simulation = this)
  }


  update(dt = 0.016) {
    // Update all planets in simulation
    // this.planets.map(planet => planet.update(planet.position.magnitude()))
    this.planets.map(planet => planet.update(dt))
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    this.planets.map(p => p.render(ctx))
  }

  removePlanet(planet) {
    this.planets = this.planets.filter(p => p != planet)
  }
}

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  toString() {
    return `[${this.x.toFixed(2)}, ${this.y.toFixed(2)}]`
  }

  copy() {
    return new Vector2(this.x, this.y)
  }

  dist(b){
    return Math.sqrt(Math.pow(this.x - b.x, 2) + Math.pow(this.y - b.y, 2))
  }

  sub(vector) {
    this.x -= vector.x
    this.y -= vector.y
    return this
  }

  add(vector) {
    this.x += vector.x
    this.y += vector.y
    return this
  }
  
  scale(factorX, factorY = factorX) {
    this.x *= factorX
    this.y *= factorY
    return this
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  norm() {
    const mag = this.magnitude()
    this.x /= mag
    this.y /= mag
    return this
  }
}

class Bit {
  constructor(position = new Vector2(), velocity = new Vector2()) {
    this.position = position
    this.velocity = velocity

    this.radius = 6    
    this.trace = []

    this.quad = [-1,-1]

  }


  /**
   * 
   * @param {Number} dt 
   */
  update(dt) {

    // Integrate to position
    this.position.add(this.velocity.copy().scale(dt))

    if (this.position.x > WIDTH/2){
      this.position.x = -WIDTH/2
    } 
    
    if (this.position.x < -WIDTH/2){
      this.position.x = WIDTH/2
    } 
    
    if (this.position.y > HEIGHT/2){
      this.position.y = -HEIGHT/2
    } 
    
    if (this.position.y < -HEIGHT/2){
      this.position.y = HEIGHT/2
    } 


    // Add to trace
    let snapshot = { position: this.position.copy(), velocity: this.velocity.magnitude() }
    if (this.traceStep > TRACE_LENGTH_SKIP_STEPS) {
      this.trace.push(snapshot)
      this.trace = this.trace.slice(Math.max(0, this.trace.length - TRACE_LENGTH_PARTS))
      this.traceStep = 0
    } else {
      this.traceStep = (this.traceStep || 0) + 1
      this.trace[this.trace.length - 1] = snapshot
    }
  }
  
  color() {
    return interpolateColorStyleMapping(getAngleDeg(this.velocity, new Vector2()), 10, 100, 
      [184, 233, 134, 0.8],
      [242, 100, 83, 0.8])
      // [242, 174, 84, 0.8])
  }

  /**
   * 
   * @param {CanvasRenderingContext2D} ctx 
   */
  render(ctx) {
    // Render the planet
    this.renderBit(ctx)

    // Render trace
    this.renderTrace(ctx)
  }

  renderBit(ctx) {

    ctx.beginPath()
    ctx.arc(this.position.x, this.position.y, this.radius, 0, 360)
    ctx.strokeStyle = this.exceeded_max_acceleration ? '#FF0000' : 'transparent'
    
    ctx.fillStyle = this.color()
    ctx.stroke()
    ctx.fill()
  }

  renderTrace(ctx) {
    if (this.trace.length > 1) {
      for (let i = 1; i < this.trace.length; i++) {
        if (this.trace[i - 1].position.dist(this.trace[i].position) < 100 ){
          ctx.beginPath()
          ctx.moveTo(this.trace[i - 1].position.x, this.trace[i - 1].position.y)
          ctx.lineTo(this.trace[i].position.x, this.trace[i].position.y)
          ctx.strokeStyle = colorForTrace(i, TRACE_LENGTH_PARTS)
          ctx.stroke()
        }
      }
    }
  }


}

function getAngleDeg(a = new Vector2(), b = new Vector2()) {
  var angleRad = Math.atan((a.y-b.y)/(a.x-b.x));
  var angleDeg = angleRad * 180 / Math.PI;
  
  return(angleDeg);
}



function initCanvas() {
  const canvas = document.querySelector('#canvas')
  canvas.zoom = 1
  canvas.positionX = 0
  canvas.positionY = 0

  // resize the canvas to fill browser window dynamically
  window.addEventListener('resize', resizeCanvas, false);

  canvas.addEventListener('mousemove', function (evt) {
    if (!canvas.dragging) {
      return
    }
    canvas.positionX = (canvas.positionX || 0) + evt.movementX
    canvas.positionY = (canvas.positionY || 0) + evt.movementY
  })

  canvas.addEventListener('mousedown', function drag() {
    canvas.dragging = true
  })

  canvas.addEventListener('mouseup', function () {
    canvas.dragging = false
  })

  canvas.addEventListener('wheel', function (evt) {
    canvas.zoom += canvas.zoom * (evt.deltaY / 100)
  })

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  return canvas
}

function updateCanvas(canvas) {
  const ctx = canvas.getContext('2d')
  
  // const zoom = canvas.zoom
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const x = canvas.positionX || 0
  const y = canvas.positionY || 0
  
  ctx.resetTransform()
  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
  ctx.translate(canvas.clientWidth / 2 + x, canvas.clientHeight / 2 + y)
  // ctx.scale(zoom, zoom)
}


function colorForTrace(mag, magE = 500) {
  const magS = 0
  const colorAtMax = [230, 255, 230, 0.9]
  const colorAtMin = [255, 255, 255, 0.05]

  return interpolateColorStyleMapping(mag, magS, magE, colorAtMin, colorAtMax)
}

function interpolateColorStyleMapping(mag, magS, magE, colorAtMin, colorAtMax) {
  let int = (mag - magS) / (magE - magS)
  return interpolateColorStyle(int, colorAtMin, colorAtMax)
}

function interpolateColorStyle(int, s, e) {
  int = Math.max(Math.min(int, 1), 0)
  intI = 1 - int
  return `rgba(${s[0] * intI + e[0] * int}, ${s[1] * intI + e[1] * int}, ${s[2] * intI + e[2] * int}, ${s[3] * intI + e[3] * int})`
}

function rand(min, max) {
  return Math.random() * (max-min) + min
}

window.onload = start
