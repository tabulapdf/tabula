package propub.pdf.innards;

import com.sun.pdfview.PDFShapeCmd;

public class BaseFormatter extends PDFShapeCmd {
	
	public int compareTo(PDFShapeCmd o2) {
		
		if (getBounds() == null) { return -1; }
		if (o2.getBounds() == null) { return 1; }
		
		if (getBounds().getX() > o2.getBounds().getX()) {
			return 1;
		}
		else if (getBounds().getX() < o2.getBounds().getX()) {
			return -1;
		}
		return 0;
		
	}
}
