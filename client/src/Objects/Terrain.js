import { noise as Perlin, noiseSeed } from '@chriscourses/perlin-noise'

// Class representing the terrain.
export default class Terrain {
    constructor(seed) {
        // Seed for consistant terrain generation across clients.
        this.seed = seed
        // Array of all height values.
        this.heightBuffer = []

        this.landingPadBuffer = []
        // The Container to draw the terrain in.
        this.canvas = undefined
        // The Rough bounding box of the terrain.
        this.bounds = {}
        // If the terrain requires a re-draw
        this.needsUpdate = true
    }

    /**
     * Sets a container to drae the terrain in.
     * @param {HTMLDivElement} context The container/render layer to render the terrain in.
     */
    setContext(context) {
        this.canvas = context
        this.bounds = {
            top: 10E7,
            left: 0,
            right: Number(this.canvas.style.width.split('p')[0]),
            bottom: Number(this.canvas.style.height.split('p')[0]),
            lowest: -1
        }
    }

    /**
     * Generates the height buffer by using perlin noise.
     * @returns {Array<number>} The generated Height Buffer.
     */
    genTerrain() {
        noiseSeed(this.seed)

        for (let x = 0; x < this.bounds.right; x++) {
            const cratorBig = Math.sin(x * 0.009) > 0 ? (Math.sin(x * 0.009) * 1.5) + 0.7 : 1
            const cratorSmall = Math.sin(x * 0.05) > 0 ? (Math.sin(x * 0.05) * 0.2) + 1 : 1

            const noise = (1 * 1 * Perlin(x * 0.01) * 100) + 500

            this.bounds.top = noise < this.bounds.top ? noise : this.bounds.top
            this.bounds.lowest = noise > this.bounds.lowest ? noise : this.bounds.lowest

            this.heightBuffer.push(noise)

        }

        const numberOfLandingPads = 5
        const bufferLength = this.heightBuffer.length

        for (let i = 0; i < numberOfLandingPads; i++) {
            noiseSeed(i)
            const intervalStart = Math.floor(Perlin(1000000) * (bufferLength - 110))
            const intervalWidth = Math.floor(Perlin(1000000) * (100) + 1)

            const interval = this.heightBuffer.slice(intervalStart, intervalStart + intervalWidth)
            const median = this._getMedian(interval)

            console.log(intervalWidth)
            this.landingPadBuffer[i] = {
                s: intervalStart,
                arr: new Array(intervalWidth).fill(median)
            }
            this.heightBuffer.splice(intervalStart, intervalWidth, ...this.landingPadBuffer[i].arr)
        }

        return this.heightBuffer;

    }

    /**
     * Draws a given height buffer ot the screen using SVGSVGElement.
     * @param {Array<number>} terrain The Height Buffer to draw.
     */
    drawTerrain(terrain) {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        var polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        svg.style.width = '100%'
        svg.style.height = '100%'
        polygon.style.zIndex = '100'
        polygon.style.stroke = 'white'
        polygon.style.strokeWidth = '1px'
        polygon.style.zIndex = '100'
        svg.appendChild(polygon);

        terrain[0] = this.bounds.bottom + 10
        terrain[terrain.length - 1] = this.bounds.bottom + 10
        for (let x = 0; x < this.bounds.right; x++) {
            var point = svg.createSVGPoint();
            point.x = x === 0 ? x - 10 : x === this.bounds.right - 1 ? x + 10 : x === 1 ? x - 10 : x === this.bounds.right - 2 ? x + 10 : x;
            point.y = terrain[x];
            polygon.points.appendItem(point);
        }

        this.canvas.appendChild(svg)
        this.drawLandingPads()
    }

    drawLandingPads() {
        this.landingPadBuffer.forEach(pad => {
           
            const padNode = document.createElement('div')
            padNode.style.position = 'absolute'
            padNode.style.top = '0'
            padNode.style.left = '0'
            padNode.style.transform = `translate(${pad.s}px,${pad.arr[0]}px)`
            padNode.style.width = `${pad.arr.length}px`
            padNode.style.height = '2px'
            padNode.style.backgroundColor = 'white'

            this.canvas.appendChild(padNode)
        })
    }

    /**
     * Returns value of height buffer at a given index.
     * @param {number} x The index to sample the Hegight Buffer at.
     */
    getValue(x) {
        return this.heightBuffer[x]
    }

    _getMedian(arr) {
        const mid = Math.floor(arr.length / 2)
        const nums = [...arr].sort((a, b) => a - b);
        return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    }

}