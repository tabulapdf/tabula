package propub.pdf;

import com.sun.pdfview.PDFCmd;
import com.sun.pdfview.PDFFile;
import com.sun.pdfview.PDFPage;
import com.sun.pdfview.PDFShapeCmd;
import propub.pdf.innards.ColumnBreak;
import propub.pdf.innards.WordBreak;

import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.io.File;
import java.io.FileWriter;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.*;
import java.util.List;

public class PDFRipper {

	// these next methods are all broken down, mostly to avoid
	// excessive indentation due to nesting..   however, passing
	// the snap all the way through multiple methods indicates
	// there should be some class-ifying

	static Integer ROW_SNAP = 7;
	static Boolean debug = false; //default
	
	
    // takes three args - the key, the source and target filenames..
	public static void main(String[] args) throws Exception {
		/*  Argument Structure:
		 * 
		 * Sorry for such a hacky format. I'm trying to keep this as light as possible, which means forgoing argument parsing libraries.
		 * See pdftocsv.rb for an implementation example.
		 * 
		 * 1: key or columns as comma-separated, unspaced list.
		 * 	e.g., without the quotes, "120,215,345"
		 * 2: input file, string
		 * 3: output file, string
		 * 4: [optional] row_snap, string that can be parsed into an integer. Note that any invalid value is ignored and the default value is used, though the error will be noted in stderr (unless the value is "DEFAULT", which just suppresses the message.).
		 * 5: [optional] debug, if equal to "true"
		 * 
		 * Note: If you want to set the space_threshold variable but not row_snap, just set row_snap "DEFAULT"
		*/
		
		
		//Erhmahgerd.
		//In Java >7, there's a new mergesort algo. This new algorithm throws an exception when compareTo outputs are not transitive, apparently.
		//With useLegacyMergeSort, this error is not thrown, so stuff works. -Jeremy
		System.setProperty("java.util.Arrays.useLegacyMergeSort", "true");
		
        System.out.println("ripping");

        System.err.println(java.util.Arrays.toString(args));
        
		String columns_string = args[0];
		String[] columns_as_strings = columns_string.split(",");
		Integer[] columns = new Integer[columns_as_strings.length];
		try{
			for(int column_num = 0; column_num < columns_as_strings.length; column_num++){
				columns[column_num] = Integer.parseInt(columns_as_strings[column_num].trim());
			}
		}catch(NumberFormatException e){
			System.err.println("Couldn't parse your column values. Must be comma-separated integers, e.g. 100,250,300,400,500 ");
			throw e;
		}
		
		System.err.println(java.util.Arrays.toString(columns_as_strings));
		
		Integer row_snap = ROW_SNAP;
		if(args.length >= 4){
			try{
				row_snap = Integer.parseInt(args[3]);
			}catch(NumberFormatException e){
				if(!args[3].equals("DEFAULT")){
					System.err.println("Your row_snap argument was invalid. Must be an integer. Proceeding with default");
				}
			}
		}
		
		if (args.length >= 5){
			try{
				PDFRipper.debug = new Boolean(Boolean.parseBoolean(args[4]));
			}catch(NumberFormatException e){
				System.err.println("Your debug argument was invalid. Must be either 'true' or 'false'");
			}
		}
		
		//TODO: implement parseable UNIX-style argument, rather than counting on a consistent order
		processFile(args[1], args[2], columns, row_snap);
	}
		
	public static void processFile(String source, String target, Integer[] columns, Integer snap) throws Exception{
		
        System.out.println("columns:"+columns.length);
		if (columns != null && columns.length > 0) {
			
			System.out.println("processing");
			RandomAccessFile raf = new RandomAccessFile(new File(source), "r");
			FileChannel channel = raf.getChannel();
			ByteBuffer buf = channel.map(FileChannel.MapMode.READ_ONLY, 0,
					channel.size());
			PDFFile newfile = new PDFFile(buf);

			StringBuffer everything = new StringBuffer();
			
			// only do first few pages for debugging..
			int limit = newfile.getNumPages();
			if (PDFRipper.debug) { limit = (limit < 1) ? limit : 10; }
			
			for (int pidx = 1; pidx <= limit; pidx++) {
			
				//int pidx = 1;
				PDFPage page = newfile.getPage(pidx, true);

				System.out.println("page: " + pidx + " of " + limit + "; length: " + everything.length());
				//if (page.getRotation() != 0) { System.err.println("cant deal with rotation"); return; }
				
				String usePath = null;
				if (PDFRipper.debug && (pidx == 2)) { usePath = source + "-" + pidx + ".html"; }
				
				everything.append(processPage(usePath, page, columns, snap));
				
			}

			saveCsv(target, everything.toString());
			raf.close();
		}
	}

	public static String processPage(String path, PDFPage page, Integer[] columns, Integer snap)
			throws Exception {

		List<PDFShapeCmd> commands = new ArrayList<PDFShapeCmd>();

		PDFShapeCmd prevPrevChar = null;
		PDFShapeCmd prevChar = null;
		for (int idx = 0; idx < page.getCommandCount(); idx++) {

			PDFCmd c = page.getCommand(idx);
		    //if (PDFRipper.debug) { System.out.println("shape in char:["+c.getDetails()+"]"); }
		    
			if (c instanceof PDFShapeCmd) {
				PDFShapeCmd tc = (PDFShapeCmd) c;
				char srcchar = tc.getSourceChar();
				if (PDFRipper.debug) { System.out.println("sourceChar:["+tc.getSourceChar()+"] is "+Character.getNumericValue(tc.getSourceChar())); }
				boolean isspace = false;
				
				if (srcchar == ' ') { isspace = true; }
				//if (PDFRipper.debug) { System.out.println("sourceChar:"+srcchar); }
				
				if ((tc.getSourceChar() != -1) && (!Character.isIdentifierIgnorable(srcchar))) {
					commands.add(tc);
					if (PDFRipper.debug && isspace) { System.out.println("and added it");}
					if (Character.isLetter(tc.getSourceChar())){
						prevPrevChar = prevChar;
						prevChar = tc;
					}
				}else{ 
					/* insert a space character in lieu of some crazy
					 *  character that has no dimensions or a source character, but in fact appears in complementary 
					 *  distribution with spaces in some documents.
					 */
					
					/* if( prevChar != null){
						PDFShapeCmd spaceChar = new PDFShapeCmd(prevChar.getGp(), 1, ' ');
						
						Rectangle2D b = prevChar.getBounds();
						Rectangle2D prevprevb = prevPrevChar.getBounds();
						double x = b.getX() + ((b.getWidth()) * 1.3); //once had a +1 after getWidth
						double y = b.getY();
						double w = Math.max((int) b.getWidth(), (int)prevprevb.getWidth());  //TODO multiply by a larger number, maybe 1.2 for skinny letters, less for wider letters.
						double h = (int) b.getHeight();
						
						
						if (prevChar.getSourceChar() == 'g' || prevChar.getSourceChar() == 'p' || prevChar.getSourceChar() == 'q' || prevChar.getSourceChar() == 'y'){
							 
							 //  We don't want the space to take on the dimensions
							 //  of, say, a comma or letters with descenders, since then the space might end up on the subsequent line.
							 //  This would lead to heartbreak, misery and tears. So we don't do it.
							 
							h = (int) b.getHeight() * 0.7;
						}
						Rectangle2D r = new Rectangle2D.Double(x, y, w, h);
						spaceChar.setBounds(r);
						
						commands.add(spaceChar);
						if (PDFRipper.debug) { System.out.println("added a space");}
					}*/
				}
			}else{
				/*if( prevChar != null){
					PDFShapeCmd spaceChar = new PDFShapeCmd(prevChar.getGp(), 1, ' ');
					
					Rectangle2D b = prevChar.getBounds();
					Rectangle2D prevprevb = prevPrevChar.getBounds();
					double x = b.getX() + ((b.getWidth()) * 1.3); //once had a +1 after getWidth
					double y = b.getY();
					double w = Math.max((int) b.getWidth(), (int)prevprevb.getWidth());  //TODO multiply by a larger number, maybe 1.2 for skinny letters, less for wider letters.
					double h = (int) b.getHeight();
					
					
					if (prevChar.getSourceChar() == 'g' || prevChar.getSourceChar() == 'p' || prevChar.getSourceChar() == 'q' || prevChar.getSourceChar() == 'y'){
						 
						 //  We don't want the space to take on the dimensions
						 //  of, say, a comma or letters with descenders, since then the space might end up on the subsequent line.
						 //  This would lead to heartbreak, misery and tears. So we don't do it.
						 
						h = (int) b.getHeight() * 0.7;
					}
					Rectangle2D r = new Rectangle2D.Double(x, y, w, h);
					spaceChar.setBounds(r);
					
					commands.add(spaceChar);
					if (PDFRipper.debug) { System.out.println("added a space");}
				}*/
			}
		}
		//System.out.println(commands); // be sure to fix the toString in PDFShapeCmd before using this.
		normalize(commands);
		ArrayList<PDFShapeCmd> sortedList = new ArrayList<PDFShapeCmd>(commands);

		// lets sort things here..
		Collections.sort(sortedList);

		HashMap<Integer, Vector<PDFShapeCmd>> newList = snapStuff(sortedList, snap);
	    // insertWordBreaks(newList, space);
	    
		// fix the Y's in the PDFShapeCmd to match the keys in the
		// hash
		List<PDFShapeCmd> aggregate = new ArrayList<PDFShapeCmd>();
		for (Integer key : newList.keySet()) {
			Vector<PDFShapeCmd> items = newList.get(key);
			// reset the y's to the key values
			int lastX = 0; // for empty x's of word breaks..
			for (PDFShapeCmd p : items) {
				Rectangle2D r2d = p.getBounds();
				Rectangle r = null;
				if (r2d != null) {
					r = new Rectangle((int) r2d.getX(), key,
							(int) r2d.getWidth(), (int) r2d.getHeight());
					lastX = (int)r2d.getX();
				}else { 
					r = new Rectangle(lastX+1, key, 0, 0); 
				}
				/*if(p.getSourceChar() == '\u0372'){ //whoa gettin' cranky J.
					System.out.println("found a friggin' sampi");
					r = new Rectangle( 10, key,
							3, (int) r2d.getHeight());
					lastX = (int)r2d.getX() - 10;
				}*/
				p.setBounds(r);
			}
			aggregate.addAll(items);
		}

		newList = removeDups(newList);

		// System.out.println("spaces:"+checkSpaces(aggregate));
		insertColumnBreaks(columns, newList);

		if (path != null) {

			Collections.sort(aggregate);
			saveHtml(path, aggregate);

		}

		return toCsv(newList, page.getPageNumber());

	}

	// remove the duplicate (same char, same x, same y)
	// from the rows..
	public static HashMap<Integer, Vector<PDFShapeCmd>> removeDups(
			HashMap<Integer, Vector<PDFShapeCmd>> in) {

		HashMap<Integer, Vector<PDFShapeCmd>> out = new HashMap<Integer, Vector<PDFShapeCmd>>();
		for (Integer key : in.keySet()) {

			Vector<PDFShapeCmd> duped = in.get(key);
			Vector<PDFShapeCmd> deduped = new Vector<PDFShapeCmd>();

			for (PDFShapeCmd c : duped) {
				if (!deduped.contains(c)) {
					deduped.add(c);
				}
			}			
			out.put(key, deduped);

		}

		return out;

	}

	public static String toCsv(HashMap<Integer, Vector<PDFShapeCmd>> inarg, int add_page_num) {

		StringBuffer output = new StringBuffer();

		List<Integer> rowYKeys = new ArrayList<Integer>(inarg.keySet());
		Collections.sort(rowYKeys);

		for (Integer rowYKey : rowYKeys) {

			Vector<PDFShapeCmd> oneRow = inarg.get(rowYKey);
			Collections.sort(oneRow); 
			for (PDFShapeCmd cmd : oneRow) {

				// System.out.println(cmd.getClass());

				if (cmd instanceof WordBreak) {
					output.append(" ");
				} else if (cmd instanceof ColumnBreak) {
					output.append("\t");
				} else {
					output.append(cmd.getSourceChar());
				}
			}
            output.append('\t');
            output.append(add_page_num);
			output.append('\n');

		}

		return output.toString();

	}

	public static void insertColumnBreaks(Integer[] columns,
			HashMap<Integer, Vector<PDFShapeCmd>> inarg) {

		List<ColumnBreak> breaks = new ArrayList<ColumnBreak>();
		for (int c = 0; c < columns.length; c++) {
			ColumnBreak foo = new ColumnBreak();
			foo.setSourceChar('\t');
			foo.setBounds(new Rectangle(columns[c], 0, 0, 0));
			breaks.add(foo);
		}

		for (Integer rowYKey : inarg.keySet()) {

			Vector<PDFShapeCmd> oneRow = inarg.get(rowYKey);
			oneRow.addAll(breaks);
			Collections.sort(oneRow);

		}

	}


	public static void normalize(List<PDFShapeCmd> inList) {
		// set each PDFShapeCmd's bounds to be positioned relative to each other and put the topmost letters at the top of the page box.
		
		//get the max and min Y values for the PDFShapeCmds on this page.
		int maxY = Integer.MIN_VALUE;
		int minY = Integer.MAX_VALUE;
		//int maxX = Integer.MIN_VALUE;
		//int minX = Integer.MAX_VALUE;

		for (PDFShapeCmd s : inList) {
			Rectangle2D b = s.getBounds();
			if ((int) b.getY() > maxY) {
				maxY = (int) b.getY();
			}
			if ((int) b.getY() < minY) {
				minY = (int) b.getY();
			}
			/*if ((int) b.getX() > maxX) {
				maxX = (int) b.getX();
			}
			if ((int) b.getX() < minX) {
				minX = (int) b.getX();
			}*/
		}
		
		// System.out.println(minY+" "+maxY);
		int yoffset;
		int highestY;

		if (maxY > 0) {
			yoffset = -minY;
			highestY = maxY - minY;
		} else {
			yoffset = Math.abs(minY);
			highestY = Math.abs(minY) + Math.abs(maxY);
		}

		// set each PDFShapeCmd's bounds relative to the max and min above for the page.
		// System.out.println(yoffset);
		// System.out.println(highestY);
		

		for (PDFShapeCmd s : inList) {
			Rectangle2D b = s.getBounds();
			double x = b.getX();
			double y = highestY - (b.getY() + yoffset); //Ys are, by default, relative to the bottom of the page. (e.g. y = 0 is at the bottom, y = 1000 is 1000px from the bottom.)
			double w = (int) b.getWidth();
			double h = (int) b.getHeight();
			Rectangle2D r = new Rectangle2D.Double(x, y, w, h);
			s.setBounds(r);
			
		}

	}

	public static void saveHtml(String fn, List<PDFShapeCmd> inList)
			throws Exception {

		File nf = new File(fn);
		nf.setWritable(true);
		FileWriter tw = new FileWriter(nf);
		tw.write("<html><head><style>div { font-size: 6px; position: absolute; border: solid 1px black; }</style></head><body>");
		for (PDFShapeCmd c : inList) {
			tw.write("<div style=\"left: " + c.getBounds().getX() + "; top: "
					+ c.getBounds().getY() + "\">" + c.getSourceChar()
					+ "</div>");
		}
		tw.write("</body></html>");
		tw.close();

	}

	public static void saveCsv(String fn, String contents) throws Exception {
		
		File nf = new File(fn);
		FileWriter tw = new FileWriter(nf);
		tw.write(contents);
		tw.close();

	}

	public static HashMap<Integer, Vector<PDFShapeCmd>> snapStuff(
			List<PDFShapeCmd> inList, Integer snap) throws Exception {

		// also index them by their Ys
		HashMap<Integer, Integer> exes = new HashMap<Integer, Integer>();
		HashMap<Integer, Vector<PDFShapeCmd>> ylookup = new HashMap<Integer, Vector<PDFShapeCmd>>();

		// index by Y value and count number of elements in each Y
		for (PDFShapeCmd c : inList) {
			Integer thisy = new Integer((int) c.getBounds().getY());

			Vector<PDFShapeCmd> tmpChildren;
			if (ylookup.containsKey(thisy)) {
				tmpChildren = ylookup.get(thisy);
			} else {
				tmpChildren = new Vector<PDFShapeCmd>();
			}
			tmpChildren.add(c);
			ylookup.put(thisy, tmpChildren);

			Integer thiscount = 0;
			if (exes.containsKey(thisy)) {
				thiscount = exes.get(thisy);
			}
			exes.put(thisy, new Integer(thiscount.intValue() + 1));
		}

		// first - figure out rows where there are a bunch of characters
		// second - if there is something that is close in y to one of those
		// rows,
		// and it wouldn't clobber something in that row (ie: that row has no
		// corresponding x) then move it to that row..

		// calculate differences from last row
		if (snap > 0) {
		List<Integer> keys = new ArrayList<Integer>(ylookup.keySet());
		Collections.sort(keys);
		ylookup = rollRows(keys, ylookup, snap);

		// we need to do it twice since we're only looking forward..
		List<Integer> newKeys = new ArrayList<Integer>(ylookup.keySet());
		Collections.sort(newKeys);
		ylookup = rollRows(newKeys, ylookup, snap);
		}
		
		List<Integer> ykeys = new ArrayList<Integer>(ylookup.keySet());
		Collections.sort(ykeys);
		
		return ylookup;

	}

	public static HashMap<Integer, Vector<PDFShapeCmd>> rollRows(
			List<Integer> keys, HashMap<Integer, Vector<PDFShapeCmd>> ylookup, Integer snap)
			throws Exception {
		// now, move around anything with a y value difference from the last row
		// of less than X where there are more things on the other row..

		// actually, we should start at the bottom and keep rolling up so
		// as to allow streaming?
		for (int rowKeyIndex = 0; rowKeyIndex < (keys.size() - 1); rowKeyIndex++) {

			Integer nextRowKey = keys.get(rowKeyIndex + 1);
			Vector<PDFShapeCmd> nextRowItems = ylookup.get(nextRowKey);
			Integer nextRowCount = nextRowItems.size();

			Integer thisRowKey = keys.get(rowKeyIndex);
			Vector<PDFShapeCmd> thisRowItems = ylookup.get(thisRowKey);
			if (thisRowItems != null) {
				Integer thisRowCount = thisRowItems.size();

				// roll into next row or pull it back?
				if (Math.abs(nextRowKey - thisRowKey) < snap) {
					if (thisRowCount > nextRowCount) {
						// pull back next row into this one
					    if (PDFRipper.debug) { System.out.println("pulling back row "+nextRowKey+" into "+thisRowKey); }
						ylookup.remove(nextRowKey);
						thisRowItems.addAll(nextRowItems);
						ylookup.put(thisRowKey, thisRowItems);
					} else {
						// roll this row forward
					    if (PDFRipper.debug) { System.out.println("rolling forward row "+thisRowKey+" into "+nextRowKey); }
						ylookup.remove(thisRowKey);
						nextRowItems.addAll(thisRowItems);
						ylookup.put(nextRowKey, nextRowItems);
					}
				}
			}
		}

		return ylookup;
	}

}
