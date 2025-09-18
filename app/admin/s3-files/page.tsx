import { S3FileManager } from "@/components/s3-file-manager";

export default function S3FilesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">S3 File Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage PDF files stored in AWS S3 bucket
        </p>
      </div>

      <S3FileManager folder="itinerary-pdfs" maxFiles={100} />
    </div>
  );
}
