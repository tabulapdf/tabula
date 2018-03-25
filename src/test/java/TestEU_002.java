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
// What will be tested for the eu_002 pdf file:
// -

public class TestEU_002 {
    public static WebDriver driver;
    public static String Tabula_url = "http://127.0.0.1:9292/";
    public WebDriverWait wait = new WebDriverWait(driver, 100);

    public void PageRefresh(){
        //menu options did not fully load
        if(driver.findElements( By.id("restore-detected-tables")).size() == 0){
            //refresh the page
            driver.navigate().refresh();
        }
        if(driver.findElements(By.id("thumbnail-list")).size() == 0){
            //refresh the page
            driver.navigate().refresh();
        }
    }
    @BeforeClass
    public static void SetUp() throws InterruptedException {
        driver = new ChromeDriver();
        driver.get(Tabula_url);
        driver.manage().window().maximize();
        String filePath = "/home/slmendez/484_P7_1-GUI/src/test/eu-002.pdf"; //
        WebElement chooseFile = driver.findElement(By.id("file"));
        chooseFile.sendKeys(filePath);
        Thread.sleep(1000);
        WebElement import_btn = driver.findElement(By.id("import_file"));
        import_btn.click();
        Thread.sleep(700);

    }
    @Test
    public void TestHalfRegexInputsforPatternBeforeandPatternAfter() throws InterruptedException{
        try {
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();
            Thread.sleep(500);

            //Test that checks that the regex search button is disabled after entering "Table 5" in pattern_before and
            // clicking the regex search button
            By pattern_before_input = By.id("pattern_before");
            driver.findElement(pattern_before_input).sendKeys("Table 5");
            //Thread.sleep(500);
            By regex_search_id = By.id("regex-search");
            assertFalse("Failed, regex search button is enabled", driver.findElement(regex_search_id).isEnabled());
            driver.findElement(pattern_before_input).clear();
            //Thread.sleep(500);
            driver.navigate().refresh();
            PageRefresh();
            Thread.sleep(500);

            //Test that checks that the regex search button is disabled after entering "Table 6" in pattern_after and
            // clicking the regex search button
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_after_input).sendKeys("Table 6");
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
    public void TestWrongInputsforBeforePatternandAfterPattern() throws InterruptedException{
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();
            Thread.sleep(500);

            //Test that inputs an incorrect input for pattern before and incorrect input for pattern after
            By pattern_before_input = By.id("pattern_before");
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_before_input).sendKeys("ksgjlk");
            driver.findElement(pattern_after_input).sendKeys("fgfsgs");
            By regex_search_id = By.id("regex-search");
            WebElement regex_button = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id));
            regex_button.click();
            Thread.sleep(500);
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            //System.out.print(result);
            Boolean regex_result;
            if(result.equals("0")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            assertTrue("Failed, regex found a match for incorrect inputs for pattern before and pattern after",
                    regex_result);
            driver.findElement(pattern_before_input).clear();
            driver.findElement(pattern_after_input).clear();
            driver.navigate().refresh();
            PageRefresh();
            Thread.sleep(500);

            //Test inputs correct input for pattern after and incorrect input for pattern before
            By pattern_before_input2 = By.id("pattern_before");
            By pattern_after_input2 = By.id("pattern_after");
            driver.findElement(pattern_before_input2).sendKeys("jflaksl");
            driver.findElement(pattern_after_input2).sendKeys("Table 6");
            By regex_search_id2 = By.id("regex-search");
            WebElement regex_button2 = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id2));
            regex_button2.click();
            Thread.sleep(500);
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result2;
            if(result2.equals("0")){ regex_result2 = true;} //if true, there are zero matches
            else{ regex_result2 = false;}
            assertTrue("Failed, regex found a match for a correct input for pattern after and incorrect input for " +
                    "pattern before", regex_result2);
            driver.findElement(pattern_before_input2).clear();
            driver.findElement(pattern_after_input2).clear();
            driver.navigate().refresh();
            PageRefresh();
            Thread.sleep(500);

            //Test inputs incorrect input for pattern after and correct input for pattern before
            By pattern_before_input3 = By.id("pattern_before");
            By pattern_after_input3 = By.id("pattern_after");
            driver.findElement(pattern_before_input3).sendKeys("Table 5");
            driver.findElement(pattern_after_input3).sendKeys("glslkgf");
            By regex_search_id3 = By.id("regex-search");
            WebElement regex_button3 = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id3));
            regex_button3.click();
            Thread.sleep(500);
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            Boolean regex_result3;
            if(result3.equals("0")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            assertTrue("Failed, regex found a match for incorrect input for pattern after and correct input for" +
                    " pattern before", regex_result3);
            driver.findElement(pattern_before_input3).clear();
            driver.findElement(pattern_after_input3).clear();

            driver.navigate().back();
            Thread.sleep(500);
        }
        catch(Exception e){
            System.out.print(e);
        }
    }
    @Test
    public void TestCommonWordInputforPatternBeforeandPatternAfter() throws InterruptedException{
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            WebElement extract_button = driver.findElement(By.linkText("Extract Data"));
            extract_button.click();
            PageRefresh();
            Thread.sleep(500);

            //Tests pattern before and pattern after with a common input found in the pdf
            By pattern_before_input = By.id("pattern_before");
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_before_input).sendKeys("Table");
            driver.findElement(pattern_after_input).sendKeys("Table");
            By regex_search_id = By.id("regex-search");
            WebElement regex_button = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id));
            regex_button.click();
            Thread.sleep(600);
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result;
            if(result.equals("1")){ regex_result = true;} //if true, there are zero matches
            else{ regex_result = false;}
            assertTrue("Failed, regex found a match for common input for both pattern before and pattern after",
                    regex_result);
            driver.findElement(pattern_before_input).clear();
            driver.findElement(pattern_after_input).clear();
            driver.navigate().refresh();
            PageRefresh();
            Thread.sleep(500);

            //Tests pattern before with a common input found in the pdf and pattern after with a correct input
            By pattern_before_input2 = By.id("pattern_before");
            By pattern_after_input2 = By.id("pattern_after");
            driver.findElement(pattern_before_input2).sendKeys("Table");
            driver.findElement(pattern_after_input2).sendKeys("Table 6");
            By regex_search_id2 = By.id("regex-search");
            WebElement regex_button2 = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id2));
            regex_button2.click();
            Thread.sleep(600);
            String result2 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result2;
            if(result2.equals("1")){ regex_result2 = true;} //if true, there are zero matches
            else{ regex_result2 = false;}
            assertTrue("Failed, regex found a match for common input for both pattern before and pattern after",
                    regex_result2);
            driver.findElement(pattern_before_input2).clear();
            driver.findElement(pattern_after_input2).clear();
            driver.navigate().refresh();
            PageRefresh();
            Thread.sleep(500);

            //Tests pattern before with a correct input and pattern after with a common input found in the pdf
            By pattern_before_input3 = By.id("pattern_before");
            By pattern_after_input3 = By.id("pattern_after");
            driver.findElement(pattern_before_input3).sendKeys("Table 5");
            driver.findElement(pattern_after_input3).sendKeys("Table");
            By regex_search_id3 = By.id("regex-search");
            WebElement regex_button3 = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id3));
            regex_button3.click();
            Thread.sleep(600);
            String result3 = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'1')]")).getText();
            Boolean regex_result3;
            if(result3.equals("1")){ regex_result3 = true;} //if true, there are zero matches
            else{ regex_result3 = false;}
            assertTrue("Failed, regex found a match for correct input for pattern before and common input for " +
                            "pattern after", regex_result3);
            driver.findElement(pattern_before_input3).clear();
            driver.findElement(pattern_after_input3).clear();

            driver.navigate().back();
            Thread.sleep(500);
        }catch(Exception e){
            System.out.print(e);
        }
    }
    @AfterClass
    public static void TearDown(){
        //navigates back and deletes the pdf utilized
        driver.findElement(By.id("delete_pdf")).click();
        driver.switchTo().alert().accept();
        driver.quit();
    }}

            // Use pattern before with inclusive and click search (3)
            // Use pattern after with inclusive and click search