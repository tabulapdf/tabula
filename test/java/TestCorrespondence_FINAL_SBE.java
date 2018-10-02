import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.io.File;
import java.nio.file.Files;
import static java.nio.file.StandardCopyOption.*;

import java.util.List;

import static junit.framework.TestCase.assertTrue;
//Test of the Correspondence_FINAL_SBE pdf file, it will go through various user scenarios to test the functionality of the regex
// implementation (spanning pages, multiple search results, inclusive and non-inclusive, and overlap)
// @author SM modified: 4/29/18

public class TestCorrespondence_FINAL_SBE {
    //Test of the Correspondence_FINAL_SBE pdf file.
    private static WebDriver driver;
    private static String Tabula_url = "http://127.0.0.1:9292/";
    private WebDriverWait wait = new WebDriverWait(driver, 500);

    //will continue to refresh the page until it sees one of the buttons appear in the menu option of the extraction page
    private void PageRefresh() throws InterruptedException {
        //menu options did not fully load
        Thread.sleep(1000);
        //refresh the page
        while(driver.findElements( By.id("restore-detected-tables")).size() == 0) {
            driver.navigate().refresh();
            Thread.sleep(700);
        }
    }
    //will navigate and wait for the data to appear in the preview and export data page
    private void PreviewandExportDatapg(){
        By previewandexport_id = By.id("all-data");
        WebElement previewandexport_button = wait.until(ExpectedConditions.visibilityOfElementLocated(previewandexport_id));
        previewandexport_button.click();
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("detection-row")));
    }
    //will wait for the regex button to become clickable and then click the regex button
    private void ClickRegexButton() throws InterruptedException {
        By regex_search_id = By.id("regex-search");
        WebElement regex_button = new WebDriverWait(driver, 30).until(ExpectedConditions.
                elementToBeClickable(regex_search_id));
        regex_button.click();
        Thread.sleep(800);
    }
    //send regex inputs to the corresponding pattern type
    private void PatternInputStrings(String pattern_before, String pattern_after){
        By pattern_before_input = By.id("pattern_before");
        By pattern_after_input = By.id("pattern_after");
        driver.findElement(pattern_before_input).sendKeys(pattern_before);
        driver.findElement(pattern_after_input).sendKeys(pattern_after);
    }
    //send corresponding info of inclusive to the pattern type
    private void InclusiveButtons(boolean patternbefore, boolean patternafter){
        WebElement inclusive_before_btn = new WebDriverWait(driver, 30).
                until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_before"))));
        WebElement inclusive_after_btn = new WebDriverWait(driver, 30).
                until(ExpectedConditions.elementToBeClickable(driver.findElement(By.id("include_pattern_after"))));
        if (patternbefore){
            inclusive_before_btn.click(); }
        if(patternafter){
            inclusive_after_btn.click(); }
    }
    //go on and upload the pdf file
    private void UploadPDF() throws InterruptedException {
        String filePath = System.getProperty("user.dir") +
                "/test/pdf/Correspondence_FINAL_SBE_one-stop_plans_adopted_for_non-unanimous_countiespdf.pdf";
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        Thread.sleep(1000);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(5000);
        wait.until(ExpectedConditions.elementToBeClickable(By.id("templates_title")));
    }
    //delete the pdf file
    private void DeletePDF(){
        //navigates back and deletes the pdf utilized
        driver.findElement(By.id("delete_pdf")).click();
        driver.switchTo().alert().accept();
    }
    //instantiation of Tabula
    @BeforeClass
    public static void SetUp(){
        try{
            Files.move(new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }


        //set up of chromedriver and navigation to the url, as well as uploading of the pdf file
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("headless");
        options.addArguments("no-sandbox");

        driver = new ChromeDriver(options);
        driver.get(Tabula_url);
        driver.manage().window().maximize();
    }
    //test of 2 different instances of inputting regex to get a multi spanning table
    @Test
    public void TestMultiPageTables() {
        try {
            UploadPDF();
            PageRefresh();
            //Test of regex input with inclusive for pattern before for a table of 3 pages in length
            PatternInputStrings("VIA", "Additional sites:");
            InclusiveButtons(true, false);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            //Confirm search found
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if (result.equals("1")) {
                regex_result = true;
            } //if true, there are zero matches
            else {
                regex_result = false;
            }
            PreviewandExportDatapg();
            //verify data extraction
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'VIA ELECTRONIC MAIL')]")).getText();
            Boolean regex_data;
            if (result_data.equals("VIA ELECTRONIC MAIL")) {
                regex_data = true;
            } else {
                regex_data = false;
            }
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Sunday, October 30: 1:00 p.m. to 5:00 p.m.')]")).getText();
            Boolean regex_data2;
            if (result_data2.equals("Sunday, October 30: 1:00 p.m. to 5:00 p.m.")) {
                regex_data2 = true;
            } else {
                regex_data2 = false;
            }
            Boolean final_results;
            if (regex_result && regex_data && regex_data2) {
                final_results = true;
            } else {
                final_results = false;
            }
            assertTrue("Failed, regex found no match for inclusive input for pattern before for a 3 page length table"
                    , final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Test of regex input with inclusive for pattern after for a table of 7 pages in length
            PatternInputStrings("Bertie County", "Watauga County");
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'2')]")).getText();
            Boolean regex_result3;
            if (result3.equals("2")) {
                regex_result3 = true;
            } //if true, there are zero matches
            else {
                regex_result3 = false;
            }
            PreviewandExportDatapg();
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Bladen County Board of Elections')]")).getText();
            Boolean regex_data5;
            if (result_data5.equals("Bladen County Board of Elections")) {
                regex_data5 = true;
            } else {
                regex_data5 = false;
            }
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Page 7')]")).getText();
            Boolean regex_data6;
            if (result_data6.equals("Page 7")) {
                regex_data6 = true;
            } else {
                regex_data6 = false;
            }
            Boolean final_results3;
            if (regex_result3 && regex_data5 && regex_data6) {
                final_results3 = true;
            } else {
                final_results3 = false;
            }
            assertTrue("Failed, Tabula found no match for a multi page table spanning more than 5 pages", final_results3);

            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    //test of 3 different instances of inputting regex searches with 3 different types of inclusive combinations to
    // get multiple regex results
    @Test
    public void TestInclusivePatternswithRegexSearches() {
        try{
            UploadPDF();
            PageRefresh();

            //Tests for inclusive for pattern before and non-inclusive for pattern after
            PatternInputStrings("County","County");
            InclusiveButtons(true, false);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'33')]")).getText();
            Boolean regex_result;
            if(result.equals("33")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            PreviewandExportDatapg();
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Nash County Board of Elections')]")).getText();
            Boolean regex_data;
            if(result_data.equals("Nash County Board of Elections")){ regex_data = true;}
            else{ regex_data = false;}
            Thread.sleep(600);
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Modifications:')]")).getText();
            Boolean regex_data2;
            if(result_data2.equals("Modifications:")){ regex_data2 = true;}
            else{ regex_data2 = false;}
            Boolean final_results;
            if(regex_result && regex_data && regex_data2){ final_results = true;}
            else{final_results = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern before and non-inclusive for " +
                    "pattern after", final_results);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for non-inclusive for pattern before and inclusive for pattern after
            PatternInputStrings("Additional", "Plan");
            InclusiveButtons(false, true);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'2')]")).getText();
            Boolean regex_result3;
            if(result2.equals("2")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            PreviewandExportDatapg();
            String result_data3 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Bladen County')]")).getText();
            Boolean regex_data3;
            if(result_data3.equals("Bladen County")){ regex_data3 = true;}
            else{ regex_data3 = false;}
            Thread.sleep(1000);
            String result_data4 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'2016 General Election Early Voting Site Implementation Plans for Non-Unanimous Counties')]")).getText();
            Boolean regex_data4;
            if(result_data4.equals("2016 General Election Early Voting Site Implementation Plans for Non-Unanimous Counties")){ regex_data4 = true;}
            else{ regex_data4 = false;}
            Boolean final_results2;
            if(regex_result3 && regex_data3 && regex_data4){ final_results2 = true;}
            else{final_results2 = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern after and non-inclusive for " +
                    "pattern before", final_results2);
            driver.navigate().refresh();
            PageRefresh();

            //Tests for inclusive for pattern before and for pattern after
            PatternInputStrings("Plan:","Modifications:");
            InclusiveButtons(true, true);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'31')]")).getText();
            Boolean regex_result4;
            if(result3.equals("31")){ regex_result4 = true;} //if true, there are zero matches
            else{ regex_result4 = false;}
            PreviewandExportDatapg();
            String result_data5 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Plan:')]")).getText();
            Boolean regex_data5;
            if(result_data5.equals("Plan:")){ regex_data5 = true;}
            else{ regex_data5 = false;}
            Thread.sleep(700);
            String result_data6 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.,'Modifications:')]")).getText();
            Boolean regex_data6;
            if(result_data6.equals("Modifications:")){ regex_data6 = true;}
            else{ regex_data6 = false;}
            Boolean final_results3;
            if(regex_result4 && regex_data5 && regex_data6){ final_results3 = true;}
            else{final_results3 = false;}
            assertTrue("Failed, Tabula found no match for inclusive for pattern after and inclusive for " +
                    "pattern before", final_results3);
            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch(Exception e){
            System.out.print(e);
        }
    }
    //test of an overlapping instance where it checks that there is only one regex result after attempting an overlap
    @Test
    public void TestOverlapRegexSearch() {
        try{
            //Test for overlapping regex searches
            UploadPDF();
            PageRefresh();

            PatternInputStrings("Please contact", "Cc.:");
            InclusiveButtons(true, false);
            ClickRegexButton();
            wait.until(ExpectedConditions.visibilityOfElementLocated(By.className("regex-result")));
            PatternInputStrings("Sincerely", "Kimberly");
            InclusiveButtons(false, true);
            ClickRegexButton();
            Thread.sleep(5000);
            driver.switchTo().alert().accept(); //accept error pop-up window
            //Checks that there is only one regex result, since it shouldn't had allowed for 2 results to appear since the
            // 2nd one causes an overlap
            Thread.sleep(2000);
            List<WebElement> regex_rows = driver.findElements(By.className("regex-result"));
            int regex_count = regex_rows.size();
            int regex_count1 = 1;
            assertTrue("Failed, Tabula found more than one match for an overlap regex search", (regex_count1 == regex_count ));
            PreviewandExportDatapg();
            String result_data = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Please contact me with any questions you may have.')]")).getText();
            Boolean regex_data;
            if (result_data.equals("Please contact me with any questions you may have.")) { regex_data = true;
            } else { regex_data = false; }
            String result_data2 = driver.findElement(By.xpath(".//*[@id='extracted-table']//td[contains(.," +
                    "'Executive Director, North Carolina State Board of Elections')]")).getText();
            Boolean regex_data2;
            if (result_data2.equals("Executive Director, North Carolina State Board of Elections")) { regex_data2 = true;
            } else { regex_data2 = false; }
            Boolean final_results;
            if (regex_data && regex_data2) { final_results = true;
            } else { final_results = false; }
            assertTrue("Failed, Tabula found no match for the multi-page table", final_results);
            driver.navigate().back();
            driver.navigate().back();
            Thread.sleep(500);
            DeletePDF();
        }catch (Exception e){
            System.out.print(e);
        }
    }
    @AfterClass
    public static void TearDown(){
        try{
            Files.move(new File("~/.tabula/workspace_moved_for_tests.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), new File("~/.tabula/pdfs/workspace.json".replaceFirst("^~", System.getProperty("user.home"))).toPath(), REPLACE_EXISTING);

        } catch (java.io.IOException e) {
        }
        
        driver.quit();
    }
}
