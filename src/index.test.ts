import rewire from "rewire"
const index = rewire("./index")
const disabled = index.__get__("disabled")
// @ponicode
describe("index.turboFetch", () => {
    test("0", () => {
        let callFunction: any = () => {
            index.turboFetch("http://www.example.com/route/123?foo=bar", "03ea49f8-1d96-4cd0-b279-0684e3eec3a9")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            index.turboFetch("https://api.telegram.org/", "a85a8e6b-348b-4011-a1ec-1e78e9620782")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction: any = () => {
            index.turboFetch("http://base.com", "a85a8e6b-348b-4011-a1ec-1e78e9620782")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction: any = () => {
            index.turboFetch("https://", "a85a8e6b-348b-4011-a1ec-1e78e9620782")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction: any = () => {
            index.turboFetch("https://croplands.org/app/a/confirm?t=", "03ea49f8-1d96-4cd0-b279-0684e3eec3a9")
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction: any = () => {
            index.turboFetch("", "")
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("disabled", () => {
    test("0", () => {
        let callFunction: any = () => {
            disabled({ bubbles: false, cancelBubble: true, cancelable: false, composed: false, currentTarget: {}, defaultPrevented: true, eventPhase: NaN, isTrusted: false, returnValue: true, srcElement: null, target: {}, timeStamp: NaN, type: "", AT_TARGET: NaN, BUBBLING_PHASE: NaN, CAPTURING_PHASE: NaN, NONE: NaN })
        }
    
        expect(callFunction).not.toThrow()
    })
})

// @ponicode
describe("index.extractURLFrom", () => {
    test("0", () => {
        let callFunction: any = () => {
            index.extractURLFrom({})
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            index.extractURLFrom(null)
        }
    
        expect(callFunction).not.toThrow()
    })
})
