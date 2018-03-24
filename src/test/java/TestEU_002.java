import org.junit.AfterClass;
import org.junit.BeforeClass;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

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
        Thread.sleep(1000);

    }
    @Test
    public void TestHalfRegexInputs() throws InterruptedException{
        try {
            //navigates to the extraction page and checks that it is in the extraction page
            By extract_name = By.linkText("Extract Data");
            WebElement extract_button = wait.until(ExpectedConditions.elementToBeClickable(extract_name));
            extract_button.click();
            driver.manage().timeouts().pageLoadTimeout(300, TimeUnit.SECONDS);
            //menu options did not fully load
            if(driver.findElements( By.id("restore-detected-tables")).size() == 0){
                //refresh the page
                driver.navigate().refresh();
            }
            if(driver.findElements(By.id("thumbnail-list")).size() == 0){
                //refresh the page
                driver.navigate().refresh();
            }
            //checks if it is in the extraction page
            String regex_options_string = "Regex Options";
            By regex_options_title = By.id("regex_options_title");
            WebElement regex_options = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Extraction page", regex_options_string.equals(regex_options.getText()));

            //Test that checks that the regex search button is disabled after entering "Table 5" in pattern_before and
            // clicking the regex search button
            By pattern_before_input = By.id("pattern_before");
            driver.findElement(pattern_before_input).sendKeys("Table 5");
            By regex_search_id = By.id("regex-search");
            assertFalse("Failed, regex search button is enabled", driver.findElement(regex_search_id).isEnabled());
            driver.findElement(pattern_before_input).clear();
            Thread.sleep(500);
            driver.navigate().refresh();
            Thread.sleep(500);

            //Test that checks that the regex search button is disabled after entering "Table 6" in pattern_after and
            // clicking the regex search button
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_after_input).sendKeys("Table 6");
            By regex_search_id2 = By.id("regex-search");
            assertFalse("Failed, regex search button is enabled", driver.findElement(regex_search_id2).isEnabled());
            driver.findElement(pattern_after_input).clear();
            
            //navigates back and deletes the pdf utilized
            Thread.sleep(500);
            driver.navigate().back();
            By delete_pdf = By.id("delete_pdf");
            WebElement delete_btn = wait.until(ExpectedConditions.elementToBeClickable(delete_pdf));
            delete_btn.click();
            driver.switchTo().alert().accept();

        } catch (Exception e) {
            System.out.print(e);
        }
    }
    @Test
    public void TestWrongInputsforBeforePatternandAfterPattern(){
        try{
            //navigates to the extraction page and checks that it is in the extraction page
            By extract_name = By.linkText("Extract Data");
            WebElement extract_button = wait.until(ExpectedConditions.elementToBeClickable(extract_name));
            extract_button.click();
            driver.manage().timeouts().pageLoadTimeout(300, TimeUnit.SECONDS);
            //menu options did not fully load
            if(driver.findElements( By.id("restore-detected-tables")).size() == 0){
                //refresh the page
                driver.navigate().refresh();
            }
            if(driver.findElements(By.id("thumbnail-list")).size() == 0){
                //refresh the page
                driver.navigate().refresh();
            }
            //checks if it is in the extraction page
            String regex_options_string = "Regex Options";
            By regex_options_title = By.id("regex_options_title");
            WebElement regex_options = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Extraction page", regex_options_string.equals(regex_options.getText()));

            //Test that inputs an incorrect input for pattern before and incorrect input for pattern after
            By pattern_before_input = By.id("pattern_before");
            By pattern_after_input = By.id("pattern_after");
            driver.findElement(pattern_before_input).sendKeys("ksgjlk");
            driver.findElement(pattern_after_input).sendKeys("fgfsgs");
            By regex_search_id3 = By.id("regex-search");
            WebElement regex_button = wait.until(ExpectedConditions.elementToBeClickable(regex_search_id3));
            regex_button.click();
            String result = driver.findElement(By.xpath(".//*[@class='regex-results-table']//td[contains(.,'0')]")).getText();
            System.out.print(result);

        }
        catch(Exception e){
            System.out.print(e);
        }
    }
    @AfterClass
    public static void TearDown(){
        driver.quit();
    }}
