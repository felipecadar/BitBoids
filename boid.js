let flock;

function setup() {
  cnv = createCanvas(windowWidth, windowHeight);
  
  //Button 1
  button1 = createButton("Clear Obstacles")
  button1.position(30, 60)
  button1.mousePressed(clearObstacles)
  button1.style("background-color: #008CBA; \
                 border: none; \
                 color: white; \
                 text-align: center; \
                 text-decoration: none; \
                 display: inline-block; \
                 font-size: 15px;")
                
  //Button 2
  button2 = createButton("Clear Boids")
  button2.position(150, 60)
  button2.mousePressed(clearBoids)
  button2.style("background-color: #008CBA; \
                 border: none; \
                 color: white; \
                 text-align: center; \
                 text-decoration: none; \
                 display: inline-block; \
                 font-size: 15px;")

  // fullscreen();
  
  flock = new Flock();
  // Add an initial set of boids into the system
  for (let i = 0; i < 100; i++) {
    let b = new Boid(width / 2,height / 2);
    flock.addBoid(b);
  }

  flock.addObstacle(new Obstacle(width / 2,height / 2))

}

function clearObstacles(){
  flock.obstacles = []
}

function clearBoids(){
  flock.boids = []
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(51);
  flock.run();

  textSize(16);
  fill(255, 255, 255);
  text('Doble Click to add obstacles. \nClick and drag to add boids!', 30, 30);

}

// Add a new boid into the System
function mouseDragged() {
  if (mouseButton === LEFT){
    flock.addBoid(new Boid(mouseX, mouseY));
  }
}

function doubleClicked(){
  flock.addObstacle(new Obstacle(mouseX, mouseY));
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
  // An array for all the boids
  this.boids = []; // Initialize the array
  this.obstacles = []; // Initialize the array
}

Flock.prototype.run = function() {
  for (let i = 0; i < this.obstacles.length; i++) {
    this.obstacles[i].run();  // Passing the entire list of boids to each boid individually
  }
 
  for (let i = 0; i < this.boids.length; i++) {
    this.boids[i].run(this.boids, this.obstacles);  // Passing the entire list of boids to each boid individually
  }

}

Flock.prototype.addBoid = function(b) {
  this.boids.push(b);
}

Flock.prototype.addObstacle = function(b) {
  this.obstacles.push(b);
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Obstacle class
function Obstacle(x, y){
  this.position = createVector(x , y)
  this.r = 10
}

Obstacle.prototype.render = function(){
  stroke(51);
  fill('rgba(255, 0, 0, 1)')
  circle(this.position.x, this.position.y, this.r)
}


Obstacle.prototype.run = function(){
  this.render();
}

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y) {
  this.acceleration = createVector(0, 0);
  this.velocity = createVector(random(-1, 1), random(-1, 1));
  this.position = createVector(x, y);
  this.r = 3.0;
  this.maxspeed = 6;    // Maximum speed
  this.maxforce = 0.05; // Maximum steering force
}

Boid.prototype.run = function(boids, obstacles) {
  this.flock(boids, obstacles);
  this.update();
  this.borders();
  this.render();
}

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function(boids, obstacles) {
  let sep = this.separate(boids);   // Separation
  let ali = this.align(boids);      // Alignment
  let coh = this.cohesion(boids);   // Cohesion
  let obs = this.avoidObstacle(obstacles);   // Cohesion
  // Arbitrarily weight these forces
  sep.mult(2.0);
  ali.mult(1.0);
  coh.mult(1.2);
  obs.mult(6);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
  this.applyForce(obs);
}

// Method to update location
Boid.prototype.update = function() {
  // Update velocity
  this.velocity.add(this.acceleration);
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(this.velocity);
  // Reset accelertion to 0 each cycle
  this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  let steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.color = function(){
  let theta = this.velocity.heading() + radians(90);
  let c = theta/3.14
  if (c < 0){
    return lerpColor(color('rgba(221,33,33,0.7)'), color('rgba(33, 211, 56, 0.7)'), c+1);
  }else{
    return lerpColor(color('rgba(33, 211, 56, 0.7)'), color('rgba(221,33,33,0.7)'), c);
  }
}

Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  let theta = this.velocity.heading() + radians(90);
  
  fill(this.color())
  stroke(51);
  push();
  translate(this.position.x, this.position.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.r * 2);
  vertex(-this.r, this.r * 2);
  vertex(this.r, this.r * 2);
  endShape(CLOSE);
  pop();
}

// Wraparound
Boid.prototype.borders = function() {
  if (this.position.x < -this.r)  this.position.x = width + this.r;
  if (this.position.y < -this.r)  this.position.y = height + this.r;
  if (this.position.x > width + this.r) this.position.x = -this.r;
  if (this.position.y > height + this.r) this.position.y = -this.r;
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function(boids) {
  let desiredseparation = 25.0;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, boids[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}
Boid.prototype.avoidObstacle = function(obstacles) {
  let desiredseparation = 40.0;
  let steer = createVector(0, 0);
  let count = 0;
  // For every boid in the system, check if it's too close
  for (let i = 0; i < obstacles.length; i++) {
    let d = p5.Vector.dist(this.position,obstacles[i].position);
    // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
    if ((d > 0) && (d < desiredseparation)) {
      // Calculate vector pointing away from neighbor
      let diff = p5.Vector.sub(this.position, obstacles[i].position);
      diff.normalize();
      diff.div(d);        // Weight by distance
      steer.add(diff);
      count++;            // Keep track of how many
    }
  }
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0,0);
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].velocity);
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    let steer = p5.Vector.sub(sum, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0, 0);
  }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function(boids) {
  let neighbordist = 50;
  let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
  let count = 0;
  for (let i = 0; i < boids.length; i++) {
    let d = p5.Vector.dist(this.position,boids[i].position);
    if ((d > 0) && (d < neighbordist)) {
      sum.add(boids[i].position); // Add location
      count++;
    }
  }
  if (count > 0) {
    sum.div(count);
    return this.seek(sum);  // Steer towards the location
  } else {
    return createVector(0, 0);
  }
}


