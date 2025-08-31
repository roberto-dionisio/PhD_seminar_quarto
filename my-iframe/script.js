class GridWorm {
    constructor(point, interval, pointsList, offsetX, offsetY) {
        this.radius  = 2;     
        this.xCoord  = point.x + offsetX; 
        this.yCoord  = point.y + offsetY; 
        this.interval= interval;
        this.offsetX = offsetX;  // Salva l'offset
        this.offsetY = offsetY;  // Salva l'offset

        const colors = [
            "rgba(220,50,47,0.9)",    // Rosso (Red quark)
            "rgba(0,180,0,0.9)",      // Verde (Green quark) - più saturo
            "rgba(0,100,255,0.9)"   // blu
        ];
        this.mainColor = colors[Math.floor(Math.random()*colors.length)];

        this.pointsList = pointsList;  
        this.speed   = 3;   
        this.velocity= this.getVelocity(); 

        this.junctionMemory = [{x:this.xCoord,y:this.yCoord}];
        this.junctionMemoryLength = 10;  
    }

    update(bounds, globalRandomChange) {
        let prevX = this.xCoord;
        let prevY = this.yCoord;

        this.xCoord += this.velocity.x;
        this.yCoord += this.velocity.y;

        // Change direction randomly at each lattice site globally
        if (globalRandomChange) {
            // Usa coordinate locali rispetto al reticolo (sottrai l'offset)
            let localX = this.xCoord - this.offsetX;
            let localY = this.yCoord - this.offsetY;
            
            // Controlla se siamo esattamente su un punto del reticolo locale
            let isOnLatticeX = (localX % this.interval) === 0;
            let isOnLatticeY = (localY % this.interval) === 0;
            
            if (isOnLatticeX && isOnLatticeY) {
                this.velocity = this.getVelocity();
            }
        }

        // Periodic boundary conditions with trail interruption
        if (this.xCoord < bounds.left) {
            this.junctionMemory.push(null); // Interrupt trail
            this.xCoord = bounds.right;
        } else if (this.xCoord > bounds.right) {
            this.junctionMemory.push(null); // Interrupt trail
            this.xCoord = bounds.left;
        }
        if (this.yCoord < bounds.top) {
            this.junctionMemory.push(null); // Interrupt trail
            this.yCoord = bounds.bottom;
        } else if (this.yCoord > bounds.bottom) {
            this.junctionMemory.push(null); // Interrupt trail
            this.yCoord = bounds.top;
        }

        this.junctionMemory.push({x: this.xCoord, y: this.yCoord});
        if (this.junctionMemory.length > this.junctionMemoryLength) {
            this.junctionMemory.shift();
        }
    }

    getVelocity() {
        // Salva la direzione precedente per evitare di tornare indietro
        let previousDirection = this.velocity ? this.velocity : {x: 0, y: 0};
        let newVelocity;
        
        if (Math.random() > 0.5) {
            // Movimento verticale
            let direction = Math.random() > 0.5 ? -this.speed : this.speed;
            // Se la direzione precedente era opposta, c'è solo 10% di probabilità di tornare indietro
            if (previousDirection.y !== 0 && previousDirection.y === -direction && Math.random() < 0.9) {
                direction = -direction; // Mantieni la stessa direzione
            }
            newVelocity = {x: 0, y: direction};
        } else {
            // Movimento orizzontale
            let direction = Math.random() > 0.5 ? -this.speed : this.speed;
            // Se la direzione precedente era opposta, c'è solo 10% di probabilità di tornare indietro
            if (previousDirection.x !== 0 && previousDirection.x === -direction && Math.random() < 0.9) {
                direction = -direction; // Mantieni la stessa direzione
            }
            newVelocity = {x: direction, y: 0};
        }
        
        return newVelocity;
    }

    draw(ctx) {    
        ctx.strokeStyle = this.mainColor;
        ctx.globalAlpha = 0.5; 
        ctx.lineWidth = 2; 
        ctx.beginPath(); 
        let started = false;
        for (let i = 0; i < this.junctionMemory.length; i++) {
            let junction = this.junctionMemory[this.junctionMemory.length - (i + 1)];
            if (junction === null) {
                ctx.stroke(); // Finish current path
                ctx.beginPath(); // Start a new path
                started = false;
                continue;
            }
            if (!started) {
                ctx.moveTo(junction.x, junction.y);
                started = true;
            } else {
                ctx.lineTo(junction.x, junction.y);
            }
        }
        ctx.stroke(); 
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = this.mainColor;
        ctx.beginPath();
        ctx.arc(this.xCoord, this.yCoord, this.radius + 1, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class Painter {
    constructor(x0, y0, width, height, interval) {
        this.x0 = x0; 
        this.y0 = y0; 
        this.width  = width;
        this.height = height;
        this.interval = interval;

        this.points = this.createPoints();
        this.gridWorms = this.createGridWorms(); 
    }

    createPoints() {
        let points = [], interval = this.interval;
        for (let y = 0; y < this.height; y+=interval) { 
            for (let x = 0; x < this.width; x+=interval) { 
                points.push({x:x,y:y}); 
            }
        }
        return points;  
    }

    createGridWorms() {
        let gridworms = [],
            numOfGridWorms = 5; 
        for (let i = 0; i < numOfGridWorms; i++) { 
            let point = this.points[Math.floor(Math.random()*this.points.length)];
            gridworms.push(new GridWorm(point,this.interval,this.points,this.x0,this.y0));
        }
        return gridworms; 
    }

    update(globalRandomChange) {
        let bounds = {left:this.x0, right:this.x0+this.width, top:this.y0, bottom:this.y0+this.height};
        this.gridWorms.forEach(w => w.update(bounds, globalRandomChange)); 
    }

    draw(ctx) {
        // Disegna la griglia con un aspetto estetico migliorato
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)"; // Colore più chiaro e trasparente
        ctx.lineWidth = 0.5; // Linee più sottili
        for (let y = 0; y <= this.height; y += this.interval) {
            ctx.beginPath();
            ctx.moveTo(this.x0, this.y0 + y);
            ctx.lineTo(this.x0 + this.width, this.y0 + y);
            ctx.stroke();
        }
        for (let x = 0; x <= this.width; x += this.interval) {
            ctx.beginPath();
            ctx.moveTo(this.x0 + x, this.y0);
            ctx.lineTo(this.x0 + x, this.y0 + this.height);
            ctx.stroke();
        }

        // Disegna i worm (quark/gluon)
        this.gridWorms.forEach(w => w.draw(ctx));
    }
}

// setup
function getBrowserWindowSize() {
    return {x: window.innerWidth, y: window.innerHeight};
}
let browserWindowSize = getBrowserWindowSize(),
    c   = document.getElementById("gridwormCanvas"),
    ctx = c.getContext("2d");

c.width  = browserWindowSize.x; 
c.height = browserWindowSize.y; 

let SCREEN_WIDTH = browserWindowSize.x,
    SCREEN_HEIGHT= browserWindowSize.y;   

// due reticoli: in alto a sx e in basso a dx
let size = 250;
let painter1 = new Painter(40,40,size,size,40); // alto sx
let painter2 = new Painter(SCREEN_WIDTH-size-40,SCREEN_HEIGHT-size-40,size,size,40); // basso dx

function onWindowResize() {
    browserWindowSize = getBrowserWindowSize();
    c.width  = browserWindowSize.x; 
    c.height = browserWindowSize.y; 
    SCREEN_WIDTH  = browserWindowSize.x;
    SCREEN_HEIGHT = browserWindowSize.y;  

    painter2 = new Painter(SCREEN_WIDTH-size-40,SCREEN_HEIGHT-size-40,size,size,40);
}
window.addEventListener('resize', onWindowResize); 

function doAnimationLoop() {           
    const globalRandomChange = Math.random() < 0.5; // 10% chance for global direction change
    ctx.clearRect(0,0,SCREEN_WIDTH,SCREEN_HEIGHT); 
    painter1.update(globalRandomChange);   
    painter1.draw(ctx);  
    painter2.update(globalRandomChange);   
    painter2.draw(ctx);  
    requestAnimationFrame(doAnimationLoop); 
} 
requestAnimationFrame(doAnimationLoop);