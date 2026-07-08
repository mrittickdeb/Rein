/**
 * Host GStreamer runner orchestrator.
 *
 * Manages the collection of active session GstManager instances, starting,
 * stopping, and resetting pipelines dynamically.
 */

import { GstManager } from "./gstManager"
import logger from "../../utils/logger"

export class HostRunner {
	private activeSessions = new Map<string, GstManager>()
	private stoppingSessions = new Set<string>()
	private token: string
	private serverPort: number
	private onStreamError?: (
		sessionId: string,
		errorType: string,
		message: string,
	) => void

	constructor(
		baseUrl: string,
		localAuthToken: string,
		onStreamError?: (
			sessionId: string,
			errorType: string,
			message: string,
		) => void,
	) {
		this.token = localAuthToken
		this.onStreamError = onStreamError

		const portMatch = baseUrl.match(/:(\d+)/)
		this.serverPort = portMatch ? Number.parseInt(portMatch[1], 10) : 8000

		logger.info(`HostRunner initialized on port: ${this.serverPort}`)
	}

	public handleIncomingClientOffer(
		sessionId: string,
		_clientOfferSdp: string,
	): void {
		if (this.activeSessions.has(sessionId)) {
			logger.info("GStreamer pipeline already running, skipping restart")
			return
		}

		logger.info(`HostRunner launching stream for session: ${sessionId}`)

		const gst = new GstManager(sessionId)
		this.activeSessions.set(sessionId, gst)

		gst.on("exit", () => {
			const wasIntentional = this.stoppingSessions.has(sessionId)
			this.activeSessions.delete(sessionId)
			this.stoppingSessions.delete(sessionId)
			if (wasIntentional) {
				logger.info(`GStreamer pipeline stopped for session: ${sessionId}`)
				return
			}
			if (this.onStreamError) {
				this.onStreamError(
					sessionId,
					"gstreamer-exit",
					"GStreamer pipeline exited unexpectedly",
				)
			}
		})

		gst.on("capture-failure", (err: unknown) => {
			const errMsg = err instanceof Error ? err.message : String(err)
			logger.error(`Capture failure for session: ${sessionId}: ${errMsg}`)
			this.activeSessions.delete(sessionId)
			if (this.onStreamError) {
				this.onStreamError(
					sessionId,
					"capture-failure",
					`Capture failure: ${errMsg}`,
				)
			}
		})

		void gst.start(this.token, this.serverPort)
	}

	public shutdown(): void {
		for (const [sessionId, manager] of this.activeSessions.entries()) {
			this.stoppingSessions.add(sessionId)
			manager.stop()
		}
		this.activeSessions.clear()
		logger.info("HostRunner shutdown")
	}
}
