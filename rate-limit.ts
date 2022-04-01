export class RateLimiter {
    timeLimit: number;
    lastClearTime: number;
    currentRate: number;
    rateLimit: number;

    constructor(rateLimit: number, timeLimit: number) {
        this.rateLimit = rateLimit;
        this.timeLimit = timeLimit;
        this.currentRate = 0;
        this.lastClearTime = Date.now();
    }

    ready(): boolean {
        return this.currentRate < this.rateLimit || this.lastClearTime + this.timeLimit < Date.now();
    }
    
    use(rate: number): number {
        if(this.lastClearTime + this.timeLimit < Date.now()) {
            this.lastClearTime = Date.now();
            this.currentRate = 0;
        } else {
            if(this.currentRate >= this.rateLimit) {
                //Short-circuit if we're at the rate limit
                return 0;
            }
        }

        //Apply bounding to increment in case it would put the change over the rate limit
        let boundedRate = rate;
        const newRate = this.currentRate + Math.abs(rate);
        if(newRate > this.rateLimit) {
            boundedRate += (newRate - this.rateLimit) * (rate > 0 ? -1 : 1);
        }

        this.currentRate += + Math.abs(rate);
        return boundedRate;
    }
}