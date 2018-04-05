import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertFalse;

//Test of the eu_002 pdf file.
// TODO: currently, I do not know how to directly call a pdf file so I can use it for the test cases without manually
//  using the windows explorer to retrieve it. For now, the pdf will be preloaded onto Tabula for testing.

public class TestEU_002 {
    private static WebDriver driver;
    private static String Tabula_url = "http://127.0.0.1:9292/";
    private WebDriverWait wait = new WebDriverWait(driver, 100);

    private void PageRefresh() throws InterruptedException {
        //menu options did not fully load
        Thread.sleep(1000);
        //refresh the page
        while(driver.findElements( By.id("restore-detected-tables")).size() == 0) {
            driver.navigate().refresh();
            Thread.sleep(700);
        }
    }
    private void PreviewandExportDatapg(){
        By previewandexport_id = By.id("all-data");
        WebElement previewandexport_button = wait.until(ExpectedConditions.visibilityOfElementLocated(previewandexport_id));
        previewandexport_button.click();
    }
    private void ClickRegexButton() throws InterruptedException {
        By regex_search_id = By.id("regex-search");
        WebElement regex_button = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id));
        regex_button.click();
        Thread.sleep(600);
    }
    private void PatternInputStrings(String pattern_before, String pattern_after){
        By pattern_before_input = By.id("pattern_before");
        By pattern_after_input = By.id("pattern_after");
        driver.findElement(pattern_before_input).sendKeys(pattern_before);
        driver.findElement(pattern_after_input).sendKeys(pattern_after);
    }
    private void InclusiveButtons(boolean patternbefore, boolean patternafter) throws InterruptedException {
        WebElement inclusive_before_btn = driver.findElement(By.id("include_pattern_before"));
        WebElement inclusive_after_btn = driver.findElement(By.id("include_pattern_after"));
        if (patternbefore){
            inclusive_before_btn.click();
        }
        if(patternafter){
            inclusive_after_btn.click();
        }
    }
    @BeforeClass
    public static void SetUp() throws InterruptedException {
        //set up of chromdriver and navigation to the url, as well as uploading of the pdf file
        driver = new ChromeDriver();
        driver.get(Tabula_url);
        driver.manage().window().maximize();
        String filePath = "/home/slmendez/484_P7_1-GUI/src/test/pdf/eu-002.pdf"; //
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        Thread.sleep(1000);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(700);
    }
    @Test
    public void TestHalfRegexInputsforPatternBeforeandPatternAfter(){
        try {
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();

            //Test that checks that the regex search button is disabled after entering "Table 5" in pattern_before and
            // clicking the regex search button
            By pattern_before_input = By.id("pattern_before");
            driver.findElement(pattern_before_input).sendKeys("Chart 4");
            By regex_search_id = By.id("regex-search");
            assertFalse("Failed, regex search button is enabled", driver.findElement(regex_search_id).isEnabled());
            driver.findElement(pattern_before_input).clear();
            driver.navigate().refresh();
            PageRefresh();

            //Test that checks that the regex search button is disabled after entering "Table 6" in pattern_after and
            // clicking the regex search button
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_after_input).sendKeys("Chart 5");
            //Thread.sleep(500);
            By regex_search_id2 = By.id("regex-search");
            assertFalse("Failed, regex search button is enabled", driver.findElement(regex_search_id2).isEnabled());
            driver.findElement(pattern_after_input).clear();

            driver.navigate().back();
            Thread.sleep(500);

        } catch (Exception e) {
            System.out.print(e);
        }
    }
    @Test
    public void TestWrongInputsforBeforePatternandAfterPattern(){
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();

            //Test that inputs an incorrect input for pattern before and incorrect input for pattern after
            PatternInputStrings("ksgjlk", "fgfsgs");
            ClickRegexButton();
            Thread.sleep(1000);
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result;
            if(result.equals("0")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            assertTrue("Failed, Tabula found a match for incorrect inputs for pattern before and pattern after",
                    regex_result);
            driver.navigate().refresh();
            PageRefresh();

            //Test inputs correct input for pattern after and incorrect input for pattern before
            PatternInputStrings("jflaksl","Table 6" );
            ClickRegexButton();
            Thread.sleep(1000);
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result2;
            if(result2.equals("0")){ regex_result2 = true;} //if true, there are zero matches
            else{ regex_result2 = false;}
            assertTrue("Failed, Tabula found a match for a correct input for pattern after and incorrect input for " +
                    "pattern before", regex_result2);
            driver.navigate().refresh();
            PageRefresh();

            //Test inputs incorrect input for pattern after and correct input for pattern before
            PatternInputStrings("Table 5","glslkgf");
            ClickRegexButton();
            Thread.sleep(1000);
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result3;
            if(result3.equals("0")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            assertTrue("Failed, Tabula found a match for incorrect input for pattern after and correct input for" +
                    " pattern before", regex_result3);

            driver.navigate().back();
            Thread.sleep(500);
        }
        catch(Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestCommonWordInputforPatternBeforeandPatternAfter(){
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();

            //Tests pattern before and pattern after with a common input found in the pdf
            PatternInputStrings("Impacts", "Impacts");
            ClickRegexButton();
            Thread.sleep(1000);
            PageRefresh();
            //confirmation of data picked and number of results from the regex results table in the extraction page
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Knowledge')]")).getText();
            Boolean regex_data;
            if(result_data.equals("Knowledge and awareness of different cultures")){ regex_data = true;}
            else{ regex_data = false;}
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Self')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("Self competence")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, Tabula found no match/correct match for a common input found in the pdf for both " +
                            "pattern before and pattern after",
                    final_results);
            driver.navigate().back();
            Thread.sleep(500);

            driver.navigate().refresh();
            PageRefresh();

            //Tests pattern before with a common input found in the pdf and pattern after with a correct input
            PatternInputStrings("Impacts", "Impacts on participating teachers");
            ClickRegexButton();
            Thread.sleep(1000);
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result2;
            if(result2.equals("1")){ regex_result2 = true;}
            else{ regex_result2 = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Knowledge')]")).getText();
            Boolean regex_data3;
            if(result_data3.equals("Knowledge and awareness of different cultures")){ regex_data3 = true;}
            else{ regex_data3 = false;}
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Self')]")).getText();
            Boolean regex_data4;
            if(result_data4.equals("Self competence")){ regex_data4 = true;}
            else{ regex_data4 = false;}
            Boolean final_results2;
            if(regex_result2 && regex_data3 && regex_data4){ final_results2 = true;}
            else{final_results2 = false;}
            assertTrue("Failed, Tabula found no match/correct match for a common input for pattern before and " +
                            "correct input for pattern after", final_results2);
            driver.navigate().refresh();
            PageRefresh();

            //Tests pattern before with a correct input and pattern after with a common input found in the pdf
            PatternInputStrings("Impacts on participating pupils","Impacts");
            ClickRegexButton();
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if(result3.equals("1")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Knowledge')]")).getText();
            Boolean regex_data5;
            if(result_data5.equals("Knowledge and awareness of different cultures")){ regex_data5 = true;}
            else{ regex_data5 = false;}
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Self')]")).getText();
            Boolean regex_data6;
            if(result_data6.equals("Self competence")){ regex_data6 = true;}
            else{ regex_data6 = false;}
            Boolean final_results3;
            if(regex_result3 && regex_data5 && regex_data6){ final_results3 = true;}
            else{final_results3 = false;}
            assertTrue("Failed, Tabula found no match/correct match for a common input for pattern after and " +
                    "correct input for pattern after", final_results3);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
        }catch(Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestInclusiveInputsforPatternBeforeandPatternAfter() {
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();

            //Tests for inclusive for pattern before and non-inclusive for pattern after
            PatternInputStrings("European/International","International");
            InclusiveButtons(true, false);
            ClickRegexButton();
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'European/International')]")).getText();
            Boolean regex_data;
            if(result_data.equals("European/International dimension of the")){ regex_data = true;}
            else{ regex_data = false;}
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'day')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("day school-life")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern before and non-inclusive for " +
                    "pattern after", final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for non-inclusive for pattern before and inclusive for pattern after
            PatternInputStrings("European/International", "International");
            InclusiveButtons(false, true);
            ClickRegexButton();
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if(result2.equals("1")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'school')]")).getText();
            Boolean regex_data3;
            if(result_data3.equals("school")){ regex_data3 = true;}
            else{ regex_data3 = false;}
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'International')]")).getText();
            Boolean regex_data4;
            if(result_data4.equals("International mobility of pupils")){ regex_data4 = true;}
            else{ regex_data4 = false;}
            Boolean final_results2;
            if(regex_result3 && regex_data3 && regex_data4){ final_results2 = true;}
            else{final_results2 = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern after and non-inclusive for " +
                    "pattern before", final_results2);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for inclusive for pattern before and for pattern after
            PatternInputStrings("European/International","Training");
            InclusiveButtons(true, true);
            Thread.sleep(500);
            ClickRegexButton();
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result4;
            if(result3.equals("1")){ regex_result4 = true;} //if true, there are zero matches
            else{ regex_result4 = false;}
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'European/International')]")).getText();
            Boolean regex_data5;
            if(result_data5.equals("European/International dimension of the")){ regex_data5 = true;}
            else{ regex_data5 = false;}
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Training')]")).getText();
            Boolean regex_data6;
            if(result_data6.equals("Training of teachers")){ regex_data6 = true;}
            else{ regex_data6 = false;}
            Boolean final_results3;
            if(regex_result4 && regex_data5 && regex_data6){ final_results3 = true;}
            else{final_results3 = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern after and inclusive for " +
                    "pattern before", final_results3);
            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
        }catch(Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestCaseSensitivity() throws InterruptedException{
        //navigates to the extraction page and checks that it is in the extraction page
        WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
        extract_button.click();
        PageRefresh();

        //Test case sensitive input for pattern before and correct input for pattern after
        PatternInputStrings("knowledge and awareness", "Self competence");
        ClickRegexButton();
        Thread.sleep(1000);
        String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
        //check that there is 0 results in the regex table
        Boolean regex_result;
        if(result.equals("0")){ regex_result = true;} //if true, there are zero matches
        else{ regex_result = false;}
        assertTrue("Failed, Tabula found a match for a case-sensitive search of pattern before",
                regex_result);
        driver.navigate().refresh();
        PageRefresh();

        //Test case sensitive input for pattern after and correct input for pattern before
        PatternInputStrings("Knowledge and awareness", "self competence");
        ClickRegexButton();
        Thread.sleep(1000);
        String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
        //check that there is 0 results in the regex table
        Boolean regex_result2;
        if(result2.equals("0")){ regex_result2 = true;} //if true, there are zero matches
        else{ regex_result2 = false;}
        assertTrue("Failed, Tabula found a match for a case-sensitive search of pattern after",
                regex_result2);
        driver.navigate().refresh();
        PageRefresh();

        //Test case sensitive input for both pattern before and pattern after
        PatternInputStrings("knowledge and awareness", "self competence");
        ClickRegexButton();
        Thread.sleep(1000);
        String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
        //check that there is 0 results in the regex table
        Boolean regex_result3;
        if(result3.equals("0")){ regex_result3 = true;} //if true, there are zero matches
        else{ regex_result3 = false;}
        assertTrue("Failed, Tabula found a match for a case-sensitive search of pattern after and pattern before",
                regex_result3);
        driver.navigate().back();
        Thread.sleep(500);
    }
    @Test
    public void TestTextBasedImage(){
        try {
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();

            //Test to get only the text-based image to appear in the preview and export data page
            PatternInputStrings("satisfied", "Question");
            ClickRegexButton();
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if (result.equals("1")) { regex_result = true; } //if true, there are zero matches
            else { regex_result = false; }
            PreviewandExportDatapg();
            Thread.sleep(600);
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Total')]")).getText();
            Boolean regex_data;
            if (result_data.equals("Total")) { regex_data = true; }
            else { regex_data = false; }
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'EU-25/EFTA: Middle')]")).getText();
            System.out.print(result_data2);
            Boolean regex_data2;
            if (result_data2.equals("EU-25/EFTA: Middle (AT, BE, DE, LI, LU, NL)")) {
                regex_data2 = true; }
                else { regex_data2 = false; }
            Boolean final_results;
            if (regex_result && regex_data && regex_data2) { final_results = true; }
                else { final_results = false; }
            assertTrue("Failed, Tabula could not find the text-based image", final_results);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
        }catch (Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestVerticalTable() throws InterruptedException{
        //navigates to the extraction page and checks that it is in the extraction page
        WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
        extract_button.click();
        PageRefresh();

        //Test for vertical table

    }
    @Test
    public void TestMultipleRegexSearches() throws InterruptedException{
        //navigates to the extraction page and checks that it is in the extraction page
        WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
        extract_button.click();
        PageRefresh();

        PatternInputStrings("Impacts", "Knowledge");
        InclusiveButtons(true, true);
        ClickRegexButton();
        String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'2')]")).getText();
        Boolean regex_result;
        if(result.equals("2")){ regex_result = true;} //if true, there are zero matches
        else{ regex_result = false;}
        PreviewandExportDatapg();
        Thread.sleep(600);

        String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                "'Impacts on participating pupils')]")).getText();
        System.out.print(result_data);
        Boolean regex_data;
        if(result_data.equals("Impacts on participating pupils")){ regex_data = true;}
        else{ regex_data = false;}
        String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Knowledge/appreciation of school')]")).getText();
        System.out.print(result_data2);
        Boolean regex_data2;
        if(result_data2.equals("Knowledge/appreciation of school system and")){ regex_data2 = true;}
        else{ regex_data2 = false;}
        Boolean final_results;
        if(regex_result && regex_data && regex_data2){ final_results = true;}
        else{final_results = false;}
        assertTrue("Failed, Tabula didn't find the 2 regex matches", final_results);
        driver.navigate().refresh();
        PageRefresh();
        driver.navigate().back();
        Thread.sleep(500);
    }
    @AfterClass
    public static void TearDown(){
        //navigates back and deletes the pdf utilized
        driver.findElement(By.id("delete_pdf")).click();
        driver.switchTo().alert().accept();
        driver.quit();
    }}
    //TODO: ") causes an error on Tabula
