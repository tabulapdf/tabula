/*
 * $Id: PDFGlyph.java,v 1.3 2009-02-09 16:35:01 tomoke Exp $
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

package com.sun.pdfview.font;

import com.sun.pdfview.PDFPage;
import com.sun.pdfview.PDFShapeCmd;

import java.awt.geom.AffineTransform;
import java.awt.geom.GeneralPath;
import java.awt.geom.Point2D;

/**
 * A single glyph in a stream of PDF text, which knows how to write itself
 * onto a PDF command stream
 */
public class PDFGlyph {
    /** the character code of this glyph */
    private char src;
    
    /** the name of this glyph */
    private String name;
    
    /** the advance from this glyph */
    private Point2D advance;
    
    /** the shape represented by this glyph (for all fonts but type 3) */
    private GeneralPath shape;
    
    /** the PDFPage storing this glyph's commands (for type 3 fonts) */
    private PDFPage page;
    
    /** Creates a new instance of PDFGlyph based on a shape */
    public PDFGlyph(char src, String name, GeneralPath shape, 
                    Point2D.Float advance) {
        this.shape = shape;
        this.advance = advance;
        this.src = src;
        this.name = name;
    }
    
    /** Creates a new instance of PDFGlyph based on a page */
    public PDFGlyph(char src, String name, PDFPage page, Point2D advance) {
        this.page = page;
        this.advance = advance;
        this.src = src;
        this.name = name;
    }
       
    /** Get the character code of this glyph */
    public char getChar() {
        return src;
    }
    
    /** Get the name of this glyph */
    public String getName() {
        return name;
    }
    
    /** Get the shape of this glyph */
    public GeneralPath getShape() {
        return shape;
    }
    
    /** Get the PDFPage for a type3 font glyph */
    public PDFPage getPage() {
        return page;
    }
    
    /** Add commands for this glyph to a page */
    public Point2D addCommands(PDFPage cmds, AffineTransform transform, int mode) {
        if (shape != null) {
        	GeneralPath outline = null;
            if (src == ' ') {
            	outline = new GeneralPath();
            	outline.moveTo(10.0d, 0.0d);
            	outline.moveTo(10.0d, 10.0d);
            	outline.moveTo(0.0d, 10.0d);
            	outline.moveTo(0.0d, 0.0d);
            	outline = (GeneralPath) outline.createTransformedShape(transform);
            }
            else {
            outline = (GeneralPath) shape.createTransformedShape(transform);
            }
            
            PDFShapeCmd pdfsc = new PDFShapeCmd(outline, mode, src);
            cmds.addCommand(pdfsc);
            
        } else if (page != null) {
            cmds.addCommands(page, transform);
        }

        return advance;
    }

    public String toString () {
        StringBuffer str = new StringBuffer ();
        str.append(name);
        return str.toString();
    }
}
