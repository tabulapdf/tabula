/*
 * $Id: PDFShapeCmd.java,v 1.3 2009-01-16 16:26:15 tomoke Exp $
 *
 * Copyright 2004 Sun Microsystems, Inc., 4150 Network Circle,
 * Santa Clara, California 95054, U.S.A. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */
package com.sun.pdfview;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.geom.GeneralPath;
import java.awt.geom.PathIterator;
import java.awt.geom.Rectangle2D;

/**
 * Encapsulates a path.  Also contains extra fields and logic to check
 * for consecutive abutting anti-aliased regions.  We stroke the shared
 * line between these regions again with a 1-pixel wide line so that
 * the background doesn't show through between them.
 *
 * @author Mike Wessler
 */
public class PDFShapeCmd extends PDFCmd implements Comparable<PDFShapeCmd> {

    /** stroke the outline of the path with the stroke paint */
    public static final int STROKE = 1;
    /** fill the path with the fill paint */
    public static final int FILL = 2;
    /** perform both stroke and fill */
    public static final int BOTH = 3;
    /** set the clip region to the path */
    public static final int CLIP = 4;
    /** base path */
    private GeneralPath gp;
    /** the style */
    private int style;
    /** the bounding box of the path */
    private Rectangle2D bounds;
    /** the stroke style for the anti-antialias stroke */
    BasicStroke againstroke =
            new BasicStroke(2, BasicStroke.CAP_BUTT, BasicStroke.JOIN_BEVEL);
    char sourceChar;
    
    // null xstructor added
    public PDFShapeCmd() {
    	
    }
	/**
     * create a new PDFShapeCmd and check it against the previous one
     * to find any shared edges.
     * @param gp the path
     * @param style the style: an OR of STROKE, FILL, or CLIP.  As a
     * convenience, BOTH = STROKE | FILL.
     */
    public PDFShapeCmd(GeneralPath gp, int style) {
        this.gp = new GeneralPath(gp);
        this.style = style;
        bounds = gp.getBounds2D();
    }

    public PDFShapeCmd(GeneralPath gp, int style, char sourceChar) {
    	this(gp,style);
    	this.sourceChar = sourceChar;
    }
    
    /**
     * perform the stroke and record the dirty region
     */
    public Rectangle2D execute(PDFRenderer state) {
        Rectangle2D rect = null;

        if ((style & FILL) != 0) {
            rect = state.fill(gp);
          //  state.fill(new GeneralPath(gp.getBounds()));
            GeneralPath strokeagain = checkOverlap(state);
            if (strokeagain != null) {
                state.draw(strokeagain, againstroke);
            }

            if (gp != null) {
                state.setLastShape(gp);
            }
        }
        if ((style & STROKE) != 0) {
            Rectangle2D strokeRect = state.stroke(gp);
       //     state.stroke(new GeneralPath(gp.getBounds()));
            if (rect == null) {
                rect = strokeRect;
            } else {
                rect = rect.createUnion(strokeRect);
            }
        }
        if ((style & CLIP) != 0) {
            state.clip(gp);
        }

        return rect;
    }

    /**
     * Check for overlap with the previous shape to make anti-aliased shapes
     * that are near each other look good
     */
    private GeneralPath checkOverlap(PDFRenderer state) {
        if (style == FILL && gp != null && state.getLastShape() != null) {
            float mypoints[] = new float[16];
            float prevpoints[] = new float[16];

            int mycount = getPoints(gp, mypoints);
            int prevcount = getPoints(state.getLastShape(), prevpoints);

            // now check mypoints against prevpoints for opposite pairs:
            if (mypoints != null && prevpoints != null) {
                for (int i = 0; i < prevcount; i += 4) {
                    for (int j = 0; j < mycount; j += 4) {
                        if ((Math.abs(mypoints[j + 2] - prevpoints[i]) < 0.01 &&
                                Math.abs(mypoints[j + 3] - prevpoints[i + 1]) < 0.01 &&
                                Math.abs(mypoints[j] - prevpoints[i + 2]) < 0.01 &&
                                Math.abs(mypoints[j + 1] - prevpoints[i + 3]) < 0.01)) {
                            GeneralPath strokeagain = new GeneralPath();
                            strokeagain.moveTo(mypoints[j], mypoints[j + 1]);
                            strokeagain.lineTo(mypoints[j + 2], mypoints[j + 3]);
                            return strokeagain;
                        }
                    }
                }
            }
        }

        // no issues
        return null;
    }

    /**
     * Get an array of 16 points from a path
     * @return the number of points we actually got
     */
    public static int getPoints(GeneralPath path, float[] mypoints) {
        int count = 0;
        float x = 0;
        float y = 0;
        float startx = 0;
        float starty = 0;
        float[] coords = new float[6];

        PathIterator pi = path.getPathIterator(new AffineTransform());
        while (!pi.isDone()) {
            if (count >= mypoints.length) {
                mypoints = null;
                break;
            }

            int pathtype = pi.currentSegment(coords);
            switch (pathtype) {
                case PathIterator.SEG_MOVETO:
                    startx = x = coords[0];
                    starty = y = coords[1];
                    break;
                case PathIterator.SEG_LINETO:
                    mypoints[count++] = x;
                    mypoints[count++] = y;
                    x = mypoints[count++] = coords[0];
                    y = mypoints[count++] = coords[1];
                    break;
                case PathIterator.SEG_QUADTO:
                    x = coords[2];
                    y = coords[3];
                    break;
                case PathIterator.SEG_CUBICTO:
                    x = mypoints[4];
                    y = mypoints[5];
                    break;
                case PathIterator.SEG_CLOSE:
                    mypoints[count++] = x;
                    mypoints[count++] = y;
                    x = mypoints[count++] = startx;
                    y = mypoints[count++] = starty;
                    break;
            }

            pi.next();
        }

        return count;
    }

    /** Get detailed information about this shape
     */
    @Override
    public String getDetails() {
        StringBuffer sb = new StringBuffer();

        Rectangle2D b = gp.getBounds2D();
        sb.append("ShapeCommand at: " + b.getX() + ", " + b.getY() + "\n");
        sb.append("Size: " + b.getWidth() + " x " + b.getHeight() + "\n");

        sb.append("Mode: ");
        if ((style & FILL) != 0) {
            sb.append("FILL ");
        }
        if ((style & STROKE) != 0) {
            sb.append("STROKE ");
        }
        if ((style & CLIP) != 0) {
            sb.append("CLIP");
        }

        return sb.toString();
    }
    

	public char getSourceChar() {
		return sourceChar;
	}

	public void setSourceChar(char sourceChar) {
		this.sourceChar = sourceChar;
	}

	public GeneralPath getGp() {
		return gp;
	}

	public void setGp(GeneralPath gp) {
		this.gp = gp;
	}

	public Rectangle2D getBounds() {
		return bounds;
	}

	public void setBounds(Rectangle2D bounds) {
		this.bounds = bounds;
	}
	
	public boolean equals(Object other) {
		if (other instanceof PDFShapeCmd) { 
			PDFShapeCmd toCompare = (PDFShapeCmd)other;
			if (bounds.equals(toCompare.getBounds()) && sourceChar == toCompare.getSourceChar()) {
				return true;
			} /*else if(sourceChar == toCompare.getSourceChar()){ //cope with AZ 2010's Hollidaysburg -> Hollidayyssburg problem.
				if(  (bounds.getX() - toCompare.getBounds().getX()) + (bounds.getY() - toCompare.getBounds().getY()) <= 1 ){ //2 pixel threshold for equality.
					return true;
				}
			}*/
		}
		
		return false;
	}
	
	/*
	public int hashCode() {
		return (int) (bounds.getX() + (bounds.getY() * 1000000) + (sourceChar * 2000000));
	}
	*/

	@Override
	public int compareTo(PDFShapeCmd o2) {
		
		if (o2.getBounds() == null) {
			return 1;
		}
		else if (getBounds() == null) {
			return -1;
		}
		
		if (bounds.getY() == o2.getBounds().getY()) {
			if (bounds.getX() == o2.getBounds().getX()) {
				if (sourceChar >= o2.getSourceChar()) {
					return 1;
				}
				return -1;
			}
			else if (bounds.getX() > o2.getBounds().getX()) {
				return 1;
			}
			return -1;
		}
		else if (bounds.getY() > o2.getBounds().getY()) {
			return 1;
		}
		return -1;
	
	}
	public String toString(){
		//return "(" + ((Character)sourceChar).toString() + " " + bounds.getX() + " " + bounds.getY() + ")";
		return ((Character)sourceChar).toString();
	}
}
