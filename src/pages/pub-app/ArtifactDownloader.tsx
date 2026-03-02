import React, { useState } from "react";
import { Download, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ArtifactDownloaderProps {
  artifactId: string;
  artifactName: string;
  artifactData: string;
  formatType: string;
}

export const ArtifactDownloader: React.FC<ArtifactDownloaderProps> = ({
  artifactId,
  artifactName,
  artifactData,
  formatType,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  };

  const downloadAsImage = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById(`artifact-content-${artifactId}`);
      if (!element) {
        console.error("Artifact element not found");
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${sanitizeFilename(artifactName)}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error downloading as image:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsPDF = async () => {
    setIsDownloading(true);
    try {
      const element = document.getElementById(`artifact-content-${artifactId}`);
      if (!element) {
        console.error("Artifact element not found");
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Add title
      pdf.setFontSize(16);
      pdf.text(artifactName, pdfWidth / 2, 15, { align: "center" });

      // Add image
      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      pdf.save(`${sanitizeFilename(artifactName)}.pdf`);
    } catch (error) {
      console.error("Error downloading as PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadRawData = () => {
    let mimeType = "text/plain";
    let extension = "txt";

    switch (formatType) {
      case "json":
        mimeType = "application/json";
        extension = "json";
        break;
      case "code":
        mimeType = "text/plain";
        extension = "txt";
        break;
      case "markdown":
        mimeType = "text/markdown";
        extension = "md";
        break;
      case "plotly":
        mimeType = "application/json";
        extension = "json";
        break;
    }

    const blob = new Blob([artifactData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${sanitizeFilename(artifactName)}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDownloading}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? "Downloading..." : "Download"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={downloadAsPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Download as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadAsImage} className="gap-2">
          <FileImage className="h-4 w-4" />
          Download as Image
        </DropdownMenuItem>
        {["json", "code", "markdown", "plotly"].includes(formatType) && (
          <DropdownMenuItem onClick={downloadRawData} className="gap-2">
            <Download className="h-4 w-4" />
            Download Raw Data
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};