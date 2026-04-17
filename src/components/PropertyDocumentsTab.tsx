import * as React from "react";
import { motion } from "framer-motion";
import {
  Download,
  Eye,
  FileText,
  Plus,
  FolderOpen,
  Trash2,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/Toast";
import { uploadFile, deleteFile } from "@/api/files";
import { updateProperty } from "@/api/properties";
import type { PropertyDTO } from "@/api/properties";

export type PropertyDocumentsTabProps = {
  documents: PropertyDTO["documents"] | undefined;
  propertyId: string;
  propertyDTO?: PropertyDTO | null;
  onDocumentsUpdated?: () => void;
};

export const PropertyDocumentsTab = ({
  documents,
  propertyId,
  propertyDTO,
  onDocumentsUpdated,
}: PropertyDocumentsTabProps) => {
  const { user } = useUser();
  const { showToast } = useToast();
  const documentList = documents || [];
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [deletingDocId, setDeletingDocId] = React.useState<string | null>(null);
  const canManageDocuments = user?.role === "landlord";
  
  const getDocumentTypeLabel = (label: string | undefined) => {
    if (!label) return "Document";
    // Map API labels to readable names
    const labelMap: Record<string, string> = {
      "property_landSurvey": "Land Survey Document",
      "property_proofOfOwnership": "Proof of Ownership",
      "property_powerOfAttorney": "Power of Attorney",
      "property_other": "Other Document",
    };
    return labelMap[label] || label.replace("property_", "").replace(/([A-Z])/g, " $1").trim();
  };

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const handleDownload = (url: string | undefined, fileName: string | undefined) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "document";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (url: string | undefined) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const handleUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      if (!canManageDocuments) {
        showToast("Only landlords can manage property documents.", "error");
        return;
      }

      setIsUploading(true);
      try {
        const uploadedIds: string[] = [];
        for (const file of files) {
          const result = await uploadFile({
            file,
            folder: "property",
            label: "property_other",
            token: user?.token,
          });
          if (!result.success) {
            showToast(result.error || `Failed to upload ${file.name}`, "error");
            continue;
          }
          uploadedIds.push(result.data.id);
        }

        if (uploadedIds.length === 0) return;

        const existingIds = new Set<string>([
          ...(propertyDTO?.documentIds || []),
          ...documentList.map((doc) => doc.id),
        ]);
        uploadedIds.forEach((docId) => existingIds.add(docId));

        const updateResult = await updateProperty(propertyId, {
          documentIds: Array.from(existingIds),
        });

        if (!updateResult.success) {
          showToast(
            updateResult.error || "Failed to attach uploaded documents.",
            "error",
          );
          return;
        }

        showToast("Document(s) uploaded successfully", "success");
        onDocumentsUpdated?.();
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    },
    [
      canManageDocuments,
      documentList,
      onDocumentsUpdated,
      propertyDTO?.documentIds,
      propertyId,
      showToast,
      user?.token,
    ],
  );

  const handleDelete = React.useCallback(
    async (docId: string) => {
      if (!canManageDocuments) {
        showToast("Only landlords can manage property documents.", "error");
        return;
      }

      setDeletingDocId(docId);
      try {
        const deleteResult = await deleteFile(docId);
        if (!deleteResult.success) {
          showToast(
            deleteResult.error || "Failed to delete document from server.",
            "error",
          );
          return;
        }

        const existingIds = new Set<string>([
          ...(propertyDTO?.documentIds || []),
          ...documentList.map((doc) => doc.id),
        ]);
        existingIds.delete(docId);

        const updateResult = await updateProperty(propertyId, {
          documentIds: Array.from(existingIds),
        });
        if (!updateResult.success) {
          showToast(
            updateResult.error || "Document deleted but unlink failed.",
            "error",
          );
          return;
        }

        showToast("Document deleted", "success");
        onDocumentsUpdated?.();
      } finally {
        setDeletingDocId(null);
      }
    },
    [
      canManageDocuments,
      documentList,
      onDocumentsUpdated,
      propertyDTO?.documentIds,
      propertyId,
      showToast,
    ],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end">
        {canManageDocuments ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleUpload}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </motion.button>
          </>
        ) : null}
      </div>

      {/* Documents Grid */}
      {documentList.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documentList.map((doc, index) => {
            const isImage = doc.mimeType?.startsWith("image/");
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                {/* Document Thumbnail */}
                <div className="relative h-32 w-full rounded-lg bg-gray-100 mb-3 flex items-center justify-center overflow-hidden">
                  {isImage && doc.url ? (
                    <Image
                      src={doc.url}
                      alt={doc.fileName || "Document"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <FileText className="h-8 w-8 text-gray-400" />
                  )}
                </div>

                {/* Document Info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                    {doc.fileName || getDocumentTypeLabel(doc.label)}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{getDocumentTypeLabel(doc.label)}</span>
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                  <p className="text-xs text-gray-500">Uploaded {formatDate(doc.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <motion.button
                    type="button"
                    onClick={() => handleDownload(doc.url, doc.fileName)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => handleView(doc.url)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    View
                  </motion.button>
                  {canManageDocuments ? (
                    <motion.button
                      type="button"
                      onClick={() => void handleDelete(doc.id)}
                      disabled={deletingDocId === doc.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingDocId === doc.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </motion.button>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-12 px-6 rounded-lg border border-gray-200 bg-white"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <FolderOpen className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No Documents</p>
          <p className="text-xs text-gray-500 text-center">
            Documents will appear here when uploaded.
          </p>
        </motion.div>
      )}
    </div>
  );
};

