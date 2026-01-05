import * as React from "react";
import { motion } from "framer-motion";
import { Download, Eye, FileText, Plus, FolderOpen } from "lucide-react";
import type { PropertyDocument } from "@/data/mockLandlordData";

export type PropertyDocumentsTabProps = {
  documents: PropertyDocument[];
  propertyId: string;
};

export const PropertyDocumentsTab = ({
  documents,
  propertyId,
}: PropertyDocumentsTabProps) => {
  const getDocumentIcon = (type: string) => {
    return <FileText className="h-8 w-8 text-gray-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Upload
        </motion.button>
      </div>

      {/* Documents Grid */}
      {documents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, index) => (
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
              {getDocumentIcon(doc.type)}
            </div>

            {/* Document Info */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                {doc.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{doc.type}</span>
                <span>{doc.size}</span>
              </div>
              <p className="text-xs text-gray-500">Uploaded {doc.uploadedDate}</p>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View
              </motion.button>
            </div>
          </motion.div>
          ))}
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

