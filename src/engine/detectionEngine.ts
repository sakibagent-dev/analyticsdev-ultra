import { Detector, AuditContext, DetectionResult } from "../types/detection";
import { MetaPixelDetector } from "../detectors/meta/pixelDetector";
import { MetaCapiDetector } from "../detectors/meta/capiDetector";
import { GoogleAdsDetector } from "../detectors/google/adsDetector";
import { Ga4Detector } from "../detectors/google/ga4Detector";
import { GtmDetector } from "../detectors/google/gtmDetector";
import { TikTokDetector } from "../detectors/tiktok/tiktokDetector";
import { LinkedInDetector } from "../detectors/linkedin/linkedinDetector";
import { PinterestDetector } from "../detectors/pinterest/pinterestDetector";
import { MicrosoftAdsDetector } from "../detectors/microsoft/microsoftDetector";
import { SnapchatDetector } from "../detectors/snapchat/snapchatDetector";
import { RedditDetector } from "../detectors/reddit/redditDetector";
import { OpenAiAdsDetector } from "../detectors/openai/openaiDetector";
import { ConsentDetector } from "../detectors/consent/consentDetector";
import { TechDetector } from "../detectors/technology/techDetector";

export class DetectionEngine {
  private detectors: Detector[] = [];

  constructor() {
    this.registerDefaultDetectors();
  }

  private registerDefaultDetectors(): void {
    this.register(new MetaPixelDetector());
    this.register(new MetaCapiDetector());
    this.register(new GoogleAdsDetector());
    this.register(new Ga4Detector());
    this.register(new GtmDetector());
    this.register(new TikTokDetector());
    this.register(new LinkedInDetector());
    this.register(new PinterestDetector());
    this.register(new MicrosoftAdsDetector());
    this.register(new SnapchatDetector());
    this.register(new RedditDetector());
    this.register(new OpenAiAdsDetector());
    this.register(new ConsentDetector());
    this.register(new TechDetector());
  }

  public register(detector: Detector): void {
    this.detectors.push(detector);
  }

  /**
   * Runs all detectors in parallel with comprehensive error isolation.
   * If any single detector throws an exception, it returns an "error" DetectionResult
   * without crashing the overall audit process.
   */
  public async runAll(context: AuditContext): Promise<DetectionResult[]> {
    const promises = this.detectors.map(async (detector): Promise<DetectionResult> => {
      try {
        return await detector.detect(context);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          id: detector.id,
          platform: detector.name,
          component: detector.name,
          category: detector.category,
          status: "error",
          confidence: 0,
          confidenceLevel: "low",
          identifiers: [],
          events: [],
          evidence: [],
          warnings: [`Detector execution error: ${errorMsg}`],
          notes: ["Detector encountered an unexpected runtime failure during audit."],
        };
      }
    });

    return await Promise.all(promises);
  }
}
