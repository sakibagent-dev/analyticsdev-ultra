import { DomCollector } from "../collectors/domCollector";
import { DomCollection } from "../types/detection";

export class DomInspector {
  public static inspect(): DomCollection {
    return DomCollector.collect();
  }
}
