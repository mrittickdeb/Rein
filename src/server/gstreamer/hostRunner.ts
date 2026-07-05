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
			this.activeSessions.delete(sessionId)
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

		gst.start(this.token, this.serverPort).catch((err) => {
			logger.error(`Failed to launch GstManager: ${String(err)}`)
			if (this.onStreamError) {
				this.onStreamError(
					sessionId,
					"gst-launch-error",
					`Failed to launch GStreamer: ${String(err)}`,
				)
			}
		})
	}

	public shutdown(): void {
		for (const [_, manager] of this.activeSessions.entries()) {
			manager.stop()
		}
		this.activeSessions.clear()
		logger.info("HostRunner shutdown")
	}
}
