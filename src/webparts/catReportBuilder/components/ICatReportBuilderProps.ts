import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface ICatReportBuilderProps {
  apiEndpoint: string;
  apiVersion: string;
  context: WebPartContext;
} 