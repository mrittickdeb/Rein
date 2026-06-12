import koffi from "koffi"

// ── Load CoreGraphics ──────────────────────────────────────────────────────
const CG_PATH = "/System/Library/Frameworks/CoreGraphics.framework/CoreGraphics"

let _cg: ReturnType<typeof koffi.load> | null = null

function cg() {
	if (!_cg) {
		_cg = koffi.load(CG_PATH)
	}
	return _cg
}

// ── CGPoint ────────────────────────────────────────────────────────────────
export const CGPoint = koffi.struct("CGPoint", {
	x: "double",
	y: "double",
})

let _CGEventCreateMouseEvent: koffi.KoffiFunction | null = null
let _CGEventCreateKeyboardEvent: koffi.KoffiFunction | null = null
let _CGEventCreateScrollWheelEvent: koffi.KoffiFunction | null = null
let _CGEventPost: koffi.KoffiFunction | null = null
let _CFRelease: koffi.KoffiFunction | null = null
let _CGEventSetIntegerValueField: koffi.KoffiFunction | null = null
let _CGEventSetDoubleValueField: koffi.KoffiFunction | null = null
let _CGEventGetLocation: koffi.KoffiFunction | null = null

function ensureFunctions() {
	const lib = cg()
	if (!_CGEventCreateMouseEvent) {
		_CGEventCreateMouseEvent = lib.func(
			"void * CGEventCreateMouseEvent(void *, uint32, CGPoint, uint32)",
		)
		_CGEventCreateKeyboardEvent = lib.func(
			"void * CGEventCreateKeyboardEvent(void *, uint16, uint8)",
		)
		// koffi variadic: declare only fixed args; pass extras manually.
		_CGEventCreateScrollWheelEvent = lib.func(
			"void * CGEventCreateScrollWheelEvent(void *, uint32, uint32, int32, int32)",
		)

		// void CGEventPost(CGEventTapLocation tap, CGEventRef event)
		// tap: 0 = kCGHIDEventTap (injected at HID level, before window server)
		_CGEventPost = lib.func("void CGEventPost(uint32, void *)")

		// void CFRelease(CFTypeRef cf)
		_CFRelease = lib.func("void CFRelease(void *)")

		// void CGEventSetIntegerValueField(CGEventRef, CGEventField, int64)
		_CGEventSetIntegerValueField = lib.func(
			"void CGEventSetIntegerValueField(void *, uint32, int64)",
		)

		// void CGEventSetDoubleValueField(CGEventRef, CGEventField, double)
		_CGEventSetDoubleValueField = lib.func(
			"void CGEventSetDoubleValueField(void *, uint32, double)",
		)

		// CGPoint CGEventGetLocation(CGEventRef)
		_CGEventGetLocation = lib.func("CGPoint CGEventGetLocation(void *)")
	}
}

export function postMouseEvent(
	mouseType: number,
	x: number,
	y: number,
	button: number,
): void {
	ensureFunctions()
	const pt = { x, y }
	const ref = _CGEventCreateMouseEvent?.(null, mouseType, pt, button) as
		| bigint
		| number
		| null
	if (!ref) return
	_CGEventPost?.(0, ref) // 0 = kCGHIDEventTap
	_CFRelease?.(ref)
}

export function postKeyEvent(keyCode: number, keyDown: boolean): void {
	ensureFunctions()
	const ref = _CGEventCreateKeyboardEvent?.(null, keyCode, keyDown ? 1 : 0) as
		| bigint
		| number
		| null
	if (!ref) return
	_CGEventPost?.(0, ref)
	_CFRelease?.(ref)
}

export function postScrollEvent(deltaX: number, deltaY: number): void {
	ensureFunctions()
	const ref = _CGEventCreateScrollWheelEvent?.(
		null,
		1,
		2,
		Math.round(deltaY),
		Math.round(deltaX),
	) as bigint | number | null
	if (!ref) return
	_CGEventPost?.(0, ref)
	_CFRelease?.(ref)
}
