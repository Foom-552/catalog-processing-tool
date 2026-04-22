import { DropZone } from '../upload/DropZone';

export function UploadStep() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Upload Catalog File</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload your CIF 3.0 Excel template (.xls), CMS Realms template (.xlsx), or CIF text file (.cif).
          The tool will automatically detect the template type.
        </p>
      </div>
      <DropZone />
    </div>
  );
}
