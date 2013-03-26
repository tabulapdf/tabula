package propub.pdf;

import com.googlecode.javacpp.Pointer;
import com.googlecode.javacv.CanvasFrame;
import com.googlecode.javacv.cpp.opencv_core;
import com.googlecode.javacv.cpp.opencv_highgui;
import com.sun.pdfview.PDFFile;
import com.sun.pdfview.PDFPage;

import java.awt.geom.Rectangle2D;
import java.awt.geom.Rectangle2D.Double;
import java.awt.geom.Line2D;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.HashMap;

import static com.googlecode.javacv.cpp.opencv_core.*;
import static com.googlecode.javacv.cpp.opencv_imgproc.*;

public class ColumnGuesser {
	
	//how to use: java -cp $Classpath propub.pdf.ColumnGuesser $PDF_Filename        --Jeremy

    static int tunable_threshold = 500;
    public static void main(String[] args) throws Exception {
    	/*
    	 * sample output (entirely prospective at this point)
    	 * 
    	 *  Box: [x1, y1, x2, y2]
    	 *  Columns: [x1, x2, x3 ... xn]
    	 *  Rows: [y1, y2, y3 ... yn]
    	 *  
    	 */
    	
    	
    	
    	//System.out.println(java.util.Arrays.toString(args));
        //System.out.println("c.put(\"" + args[0] + "\", new int[] ");
        
        // open a pdf, make a picture and send it to opencv
        RandomAccessFile raf = new RandomAccessFile(new File(args[1]), "r");
        FileChannel channel = raf.getChannel();
        ByteBuffer buf = channel.map(FileChannel.MapMode.READ_ONLY, 0, channel.size());
        PDFFile newfile = new PDFFile(buf);
        if (newfile.getNumPages() == 0) { System.out.println("not a pdf!"); System.exit(0); }
        
        //ArrayList<Integer> cols = new ArrayList<Integer>();

        int max_pages;
        boolean individual_guesses;
        ArrayList<ArrayList<Integer>> list_of_cols = new ArrayList<ArrayList<Integer>>();
        ArrayList<Integer> cols = new ArrayList<Integer>();

        if(args.length > 2){
	        if(args[2].contains("indiv")){
	        	max_pages = Integer.MAX_VALUE;
	        	individual_guesses = true; 
	        }else{
	        	//specify the number of pages from which to deduce column values as second argument.
	        	if(args[2] != ""){
	        		max_pages = Integer.parseInt(args[2]);
	        	}else{
	        		max_pages = 5;
	        	}
	        	individual_guesses = false;
	        }
        }else{
        	max_pages = Integer.MAX_VALUE;
        	individual_guesses = false;
        }
        System.err.println("pages: " + max_pages);
        
        
        List<List<Rectangle2D.Double>> tables = new ArrayList<List<Rectangle2D.Double>>();
        //todo default if not specified.
        for(int i=1; i<= Math.min(max_pages, newfile.getNumPages()); i++){
        	//System.err.println("len: " + cols.size() + " page: " + i + "/" + Math.min(5, newfile.getNumPages()));
        	//find the columns on pages 1-5, just in case a line is missing on an occasional page.
        	
	        //gotcha: with PDFView, PDF pages are 1-indexed. If you ask for page 0 and then page 1, you'll get the first page twice. So start with index 1.
	        PDFPage apage = newfile.getPage(i,true);
	        Rectangle2D box = apage.getPageBox();
	
	        //Note: sometimes calling getWidth() and getHeight() on apage gives the right result; this used to be called on box, in what DF wrote. Does that ever work better?.
	        BufferedImage image = (BufferedImage)apage.getImage((int)apage.getWidth(),(int)apage.getHeight(),null,null,true,true);

	     //   CanvasFrame source = new CanvasFrame("Source");
	     //   source.showImage(image);
	        IplImage iplImage = IplImage.createFrom(image);
	        List<Pointer> lines = cvFindLines(iplImage, tunable_threshold,args[0] + i);
	        List<Pointer> verticalLines = filterLinesByOrientation(lines, "vertical");
	        List<Pointer> horizontalLines = filterLinesByOrientation(lines, "horizontal");
	        List<Integer> temp_cols = mapOrientedLinesToLocations(lines, "vertical");
	        
	        int current_try = tunable_threshold;
	        
	        //TODO: set higher threshold for finding columns?
	        int minimal_lines_threshold = 20; //for finding tables, this should be very high. The cost of a false positive line is low; the cost of a false negative may be high.
	        while (verticalLines.size() < minimal_lines_threshold || horizontalLines.size() < minimal_lines_threshold) { //
	            current_try -= 20; //sacrifice speed for success.
	            // we might need to give up..
	            if (current_try < 10) { break; }
	     //       System.out.println("current try:" + current_try);
	            //temp_cols = cvGuessColumns(iplImage,current_try,args[0] + i);
	            lines = cvFindLines(iplImage, current_try, args[0] + i);
		        verticalLines = filterLinesByOrientation(lines, "vertical");
		        horizontalLines = filterLinesByOrientation(lines, "horizontal");
		        temp_cols = mapOrientedLinesToLocations(lines, "vertical");
	        }
	
	      //  iplImage.release();
	        Collections.sort(temp_cols);
	        if(individual_guesses){
	        	list_of_cols.add((ArrayList<Integer>)temp_cols);
        	}else{
		        for(Integer col_item : temp_cols){
		        	if(!cols.contains(col_item)){
		        		cols.add(col_item);
		        	}
		        }
        	}
	        List<Integer> temp_rows = mapOrientedLinesToLocations(lines, "horizontal");
	        Collections.sort(temp_rows);
	        tables.add(findTables(verticalLines, horizontalLines));
        }
        
        //print stuff out as faux-json
//        System.out.println("{");
//        System.out.println("\"boxes\" : [");
//        for(int i=0; i<tables.size(); i++){ 
//        	List<Rectangle2D.Double> innerTables = tables.get(i);
//        	System.out.println("{ \"page\": " + i + ", ");
//        	System.out.println("\"tables\": [");
//        	for(Rectangle2D.Double table : innerTables){
//        		System.out.println("[" + table.x +"," + table.y + "," + table.width + "," + table.height+"],");
//        	}
//        	System.out.println("]},");
//        }
//        System.out.println("],");
//        if(individual_guesses){
//	        System.out.println("\"columns\": " + list_of_cols.toString());
//        }else{
//	        Collections.sort(cols);
//	        System.out.println("\"columns\": " + cols.toString());
//        }
//        System.out.println("}");
        System.out.println("[");
        for(int i=0; i<tables.size(); i++){ 
	    	List<Rectangle2D.Double> innerTables = tables.get(i);
	    	System.out.println("  [");
	    	for(int inner_i=0; inner_i<innerTables.size(); inner_i++){
	    		Rectangle2D.Double table = innerTables.get(inner_i);
	    		System.out.print("    [" + table.x +"," + table.y + "," + table.width + "," + table.height+"]");
	        	if(inner_i != innerTables.size()-1){
	        		System.out.print(",");
	        	}
	        	System.out.print("\n");
	    	}
	    	System.out.print("  ]");
	    	if(i != tables.size()-1){
	    		System.out.print(",");
	    	}
	    	System.out.print("\n");
	    }
        System.out.println("]");
    }
    
    static int counter = 0;
    
    public static Rectangle findSquare(List<Integer> cols, List<Integer> rows){
    	//System.err.println("sq: " + cols);
    	//System.err.println("sq: " + rows);
    	int x = cols.get(0);
    	int y = rows.get(0);
    	int h = rows.get(rows.size() - 1) - y;
    	int w = cols.get(cols.size() - 1) - x;
    	return new Rectangle(x, y, w, h );
    }
    
    public static double euclideanDistance(double x1, double y1, double x2, double y2){
    	return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }
    
    public static Line2D.Double pointerToLine(Pointer line){
    	CvPoint pt0 = new CvPoint(line).position(0);
    	CvPoint pt1 = new CvPoint(line).position(1);
    	return new Line2D.Double(pt0.x(), pt0.y(), pt1.x(), pt1.y());
    }
    
    public static String hashAPoint(double point ){
    	return String.valueOf(Math.round(point / 10.0));
    }
    public static String hashRectangle(Rectangle2D.Double r){
    	return hashAPoint(r.x) + "," + hashAPoint(r.y) + "," + hashAPoint(r.height) + "," + hashAPoint(r.width);
    }
    
    public static List<Rectangle2D.Double> findTables(List<Pointer> verticals, List<Pointer> horizontals){
    	/*
    	 * Find all the rectangles in the vertical and horizontal lines given.
    	 * 
    	 * Rectangles are deduped with hashRectangle, which considers two rectangles identical if each point rounds to the same tens place as the other.
    	 * 
    	 * TODO: alternative, raise the proximity threshold, discard rectangles contained in other rectangles. 
    	 */
    	double cornerProximityThreshold = 0.10;
    	
    	HashMap<String, Rectangle2D.Double> rectangles = new HashMap<String, Rectangle2D.Double>();
    	//find rectangles with one horizontal line and two vertical lines that end within $threshold to the ends of the horizontal line.
    	for(Pointer horizontalLinePtr : horizontals){
    		Line2D.Double horizontalLine = pointerToLine(horizontalLinePtr);
    		double horizontalLineLength = Math.abs(horizontalLine.x1 - horizontalLine.x2);
    		
    		boolean hasVerticalLineFromTheLeft = false;
    		Line2D.Double leftVerticalLine = new Line2D.Double();
    		//for the left of the vertical line.
    		for(Pointer verticalLinePtr : verticals){
        		Line2D.Double verticalLine = pointerToLine(verticalLinePtr);
        		double verticalLineLength = Math.abs(horizontalLine.y1 - horizontalLine.y2);
    			if((euclideanDistance(horizontalLine.getX1(), horizontalLine.getY1(), verticalLine.getX1(), verticalLine.getY1()) < (cornerProximityThreshold * Math.max(horizontalLineLength, verticalLineLength))) ||
    				(euclideanDistance(horizontalLine.getX1(), horizontalLine.getY1(), verticalLine.getX2(), verticalLine.getY2())) < (cornerProximityThreshold * Math.max(horizontalLineLength, verticalLineLength))){
    				if((leftVerticalLine.getX1() > verticalLine.getX1()) || ((leftVerticalLine.getY1() == 0) && (leftVerticalLine.getY2() == 0))){ //is this line is more to the left than the one we've got already. //"What's your opinion on Das Kapital?"
    					hasVerticalLineFromTheLeft = true;
    					leftVerticalLine = verticalLine;
    				}
    			}
    		}
    		//for the right of the vertical line.
    		boolean hasVerticalLineFromTheRight = false;
    		Line2D.Double rightVerticalLine = new Line2D.Double();
    		//for the left of the vertical line.
    		for(Pointer verticalLinePtr : verticals){
        		Line2D.Double verticalLine = pointerToLine(verticalLinePtr);
        		double verticalLineLength = Math.abs(horizontalLine.y1 - horizontalLine.y2);
    			if((euclideanDistance(horizontalLine.getX2(), horizontalLine.getY2(), verticalLine.getX1(), verticalLine.getY1()) < (cornerProximityThreshold * Math.max(horizontalLineLength, verticalLineLength))) ||
    				(euclideanDistance(horizontalLine.getX2(), horizontalLine.getY2(), verticalLine.getX2(), verticalLine.getY2())) < (cornerProximityThreshold * Math.max(horizontalLineLength, verticalLineLength))){
    				if((rightVerticalLine.getX1() > verticalLine.getX1()) || ((rightVerticalLine.getY1() == 0) && (rightVerticalLine.getY2() == 0))){ //is this line is more to the right than the one we've got already. //"Can you recite all of John Galt's speech?"
    					hasVerticalLineFromTheRight = true;
    					rightVerticalLine = verticalLine;
    				}
    			}
    		}
    		if (hasVerticalLineFromTheRight && hasVerticalLineFromTheLeft){
    			double height = Math.max( leftVerticalLine.getY1() - leftVerticalLine.getY2(), rightVerticalLine.getY1() - rightVerticalLine.getY2()  );
    			double y = Math.min( Math.min(leftVerticalLine.getY1(), leftVerticalLine.getY2()), Math.min(rightVerticalLine.getY1(), rightVerticalLine.getY2()));
    			Rectangle2D.Double r = new Rectangle2D.Double(horizontalLine.getX1(), y, horizontalLine.getX2() - horizontalLine.getX1(), height ); //x, y, w, h
    			rectangles.put(hashRectangle(r), r);
    		}
    	}
    	
    	//find rectangles with one vertical line and two horizontal lines that end within $threshold to the ends of the vertical line.
        for(Pointer verticalLinePtr : verticals){
            Line2D.Double verticalLine = pointerToLine(verticalLinePtr);
            double verticalLineLength = Math.abs(verticalLine.x1 - verticalLine.x2);
            
            boolean hasHorizontalLineFromTheLeft = false;
            Line2D.Double leftHorizontalLine = new Line2D.Double();
            //for the left of the horizontal line.
            for(Pointer horizontalLinePtr : horizontals){
	            Line2D.Double horizontalLine = pointerToLine(horizontalLinePtr);
	            double horizontalLineLength = Math.abs(verticalLine.y1 - verticalLine.y2);
	            if((euclideanDistance(verticalLine.getX1(), verticalLine.getY1(), horizontalLine.getX1(), horizontalLine.getY1()) < (cornerProximityThreshold * Math.max(verticalLineLength, horizontalLineLength))) ||
	                (euclideanDistance(verticalLine.getX1(), verticalLine.getY1(), horizontalLine.getX2(), horizontalLine.getY2())) < (cornerProximityThreshold * Math.max(verticalLineLength, horizontalLineLength))){
	                if((leftHorizontalLine.getX1() > horizontalLine.getX1()) || ((leftHorizontalLine.getY1() == 0) && (leftHorizontalLine.getY2() == 0))){ //is this line is more to the left than the one we've got already. //"What's your opinion on Das Kapital?"
	                    hasHorizontalLineFromTheLeft = true;
	                    leftHorizontalLine = horizontalLine;
	                }
	            }
            }
            //for the right of the horizontal line.
            boolean hasHorizontalLineFromTheRight = false;
            Line2D.Double rightHorizontalLine = new Line2D.Double();
            //for the left of the horizontal line.
            for(Pointer horizontalLinePtr : horizontals){
                Line2D.Double horizontalLine = pointerToLine(horizontalLinePtr);
                double horizontalLineLength = Math.abs(verticalLine.y1 - verticalLine.y2);
                if((euclideanDistance(verticalLine.getX2(), verticalLine.getY2(), horizontalLine.getX1(), horizontalLine.getY1()) < (cornerProximityThreshold * Math.max(verticalLineLength, horizontalLineLength))) ||
                	(euclideanDistance(verticalLine.getX2(), verticalLine.getY2(), horizontalLine.getX2(), horizontalLine.getY2())) < (cornerProximityThreshold * Math.max(verticalLineLength, horizontalLineLength))){
                	if((rightHorizontalLine.getX1() > horizontalLine.getX1()) || ((rightHorizontalLine.getY1() == 0) && (rightHorizontalLine.getY2() == 0))){ //is this line is more to the right than the one we've got already. //"Can you recite all of John Galt's speech?"
                		hasHorizontalLineFromTheRight = true;
                		rightHorizontalLine = horizontalLine;
                	}
                }
            }
            if (hasHorizontalLineFromTheRight && hasHorizontalLineFromTheLeft){
            	double width = Math.abs(Math.max( leftHorizontalLine.getX1() - leftHorizontalLine.getX2(), rightHorizontalLine.getX1() - rightHorizontalLine.getX2() ));
            	double x = Math.min( Math.min(leftHorizontalLine.getX1(), leftHorizontalLine.getX2()), Math.min(rightHorizontalLine.getX1(), rightHorizontalLine.getX2()));
            	Rectangle2D.Double r = new Rectangle2D.Double(x, Math.min(verticalLine.getY1(), verticalLine.getY2()), width, Math.abs(verticalLine.getY2() - verticalLine.getY1()) ); //x, y, w, h
            	rectangles.put(hashRectangle(r), r);
            }
        }
    	return dedupeRectangles(new ArrayList<Rectangle2D.Double>(rectangles.values()));
    }
    
    public static List<Rectangle2D.Double> dedupeRectangles(List<Rectangle2D.Double> duplicated_rectangles){
    	ArrayList<Rectangle2D.Double> rectangles = new ArrayList<Rectangle2D.Double>();
    	
    	for(Rectangle2D.Double maybe_dupe_rectangle : duplicated_rectangles){
    		boolean is_a_dupe = false;
    		ArrayList<Rectangle2D.Double> to_remove = new ArrayList<Rectangle2D.Double>();
    		for(Rectangle2D.Double non_dupe_rectangle : rectangles){
    			if (non_dupe_rectangle.contains(maybe_dupe_rectangle)){
    				is_a_dupe = true;
    			}
    			if (maybe_dupe_rectangle.contains(non_dupe_rectangle)){
    				to_remove.add(non_dupe_rectangle);
    			}
    		}
    		
    		for(Rectangle2D.Double dupe : to_remove){
    			rectangles.remove(dupe);
    		}
    		
    		if (!is_a_dupe){
    			rectangles.add(maybe_dupe_rectangle); //maybe_dupe_rectangle isn't a dupe (at least so far), so add it to rectangles.
    		}
    	}
    	return rectangles;
    }
    
    public static List<Pointer> cvFindLines(IplImage src, int threshold, String name) {
        opencv_core.IplImage dst;
        opencv_core.IplImage colorDst;

        dst = cvCreateImage(cvGetSize(src), src.depth(), 1);
        colorDst = cvCreateImage(cvGetSize(src), src.depth(), 3);

        
        //cvSmooth(src, src, CV_GAUSSIAN, 3); //Jeremy added this: Gaussian 1 appears to do nothing.
        cvCanny(src, dst, 50, 200, 3);
        cvCvtColor(dst, colorDst, CV_GRAY2BGR);

        opencv_core.CvMemStorage storage = cvCreateMemStorage(0);
        /*
         * http://opencv.willowgarage.com/documentation/feature_detection.html#houghlines2
         * 
         * distance resolution in pixel-related units.
         * angle resolution in radians
         * "accumulator value"
         * second-to-last parameter: minimum line length // was 50
         * last parameter: join lines if they are within N pixels of each other.
         * 
         */
        opencv_core.CvSeq lines = cvHoughLines2(dst, storage, CV_HOUGH_PROBABILISTIC, 1, Math.PI / 180, threshold, 20, 10);
        List<Pointer> lines_list = new ArrayList<Pointer>();

        for (int i = 0; i < lines.total(); i++) {
            Pointer line = cvGetSeqElem(lines, i);
            CvPoint pt1 = new CvPoint(line).position(0);
            CvPoint pt2 = new CvPoint(line).position(1);
            lines_list.add(line);
            cvLine(colorDst, pt1, pt2, CV_RGB(255, 0, 0), 1, CV_AA, 0); //actually draw the line on the img.
        }

        //N.B.: No images are saved if column_pictures folder in app root doesn't exist.
        opencv_highgui.cvSaveImage("column_pictures/"+ name + ".png", colorDst);
        cvReleaseImage(dst);
        cvReleaseImage(colorDst);

        return lines_list;
    }
    
    public static List<Pointer> filterLinesByOrientation(List<Pointer> lines, String orientation){
    	List<Pointer> oriented_lines = new ArrayList<Pointer>();
    	boolean oriented_correctly;
    	for(Pointer line : lines){
            CvPoint pt1 = new CvPoint(line).position(0);
            CvPoint pt2 = new CvPoint(line).position(1);
            if (orientation == "vertical" && pt1.x() == pt2.x()) {
            	oriented_correctly = true;
            }else if(orientation == "horizontal" && pt1.y() == pt2.y()){
            	oriented_correctly = true;
            }else{
            	oriented_correctly = false;
            }
            if(oriented_correctly){
            	oriented_lines.add(line);
            }
    	}
    	return oriented_lines;
    }
    
    public static List<Integer> mapOrientedLinesToLocations(List<Pointer> preOrientedLines, String orientation){
    	List<Integer> oriented_lines = new ArrayList<Integer>();
    	for(Pointer line : preOrientedLines){
	        CvPoint pt1 = new CvPoint(line).position(0);
	    	if(orientation == "horizontal"){
	    		oriented_lines.add(pt1.y());
	    	}else if(orientation == "vertical"){
	    		oriented_lines.add(pt1.x());
	    	}
    	}
    	return oriented_lines;
    }
      
    //deprecated
//    public static List<Integer> mapOrientedLinesToLocations(List<Pointer> lines, String orientation){
//    	List<Integer> oriented_lines = new ArrayList<Integer>();
//    	boolean oriented_correctly;
//    	for(Pointer line : lines){
//            CvPoint pt1 = new CvPoint(line).position(0);
//            CvPoint pt2 = new CvPoint(line).position(1);
//            if (orientation == "vertical" && pt1.x() == pt2.x()) {
//            	oriented_correctly = true;
//            }else if(orientation == "horizontal" && pt1.y() == pt2.y()){
//            	oriented_correctly = true;
//            }else{
//            	oriented_correctly = false;
//            }
//            if(oriented_correctly && orientation == "horizontal"){
//            	oriented_lines.add(pt1.y());
//            }else if(oriented_correctly && orientation == "vertical"){
//            	oriented_lines.add(pt1.x());
//            }
//    	}
//    	return oriented_lines;
//    }

}
