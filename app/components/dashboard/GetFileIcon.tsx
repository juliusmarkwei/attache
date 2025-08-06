import { FileSpreadsheet, FileText, FileType, Image } from 'lucide-react';

export const GetFileIcon = (contentType: string) => {
	if (contentType.includes('pdf')) return <FileText className="h-5 w-5 text-blue-400" />;
	if (contentType.includes('image')) return <Image className="h-5 w-5 text-green-400" />;
	if (contentType.includes('spreadsheet') || contentType.includes('excel'))
		return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
	if (contentType.includes('word') || contentType.includes('document') || contentType.includes('text'))
		return <FileText className="h-5 w-5 text-blue-500" />;
	return <FileType className="h-5 w-5 text-slate-400" />;
};
