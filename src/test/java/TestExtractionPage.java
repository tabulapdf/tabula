import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertFalse;
import static junit.framework.TestCase.assertTrue;

//Test of Tabula's extraction page, which incorporates the template, pdf outline, and regex buttons, as well as
// the regex tabs. Prior and after each button is clicked, it checks if the element is present or not on the page.
// What it doesn't test are the individual URL links in the regex tabs, since those same links are already tested in
// the TestHelpPage and TestHomePage test cases, as well as the Autodetect Tables button and the Preview & Export Data
// button are not tested since their functionality will be tested in other test cases.
// @author SM modified: 3/6/18
public class TestExtractionPage {
    WebDriver driver;
    @Test
    public void startWebDriver() throws InterruptedException{
        driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 100);

        try{
            //navigates to the extraction page and checks that it is in the extraction page
            By extract_name = By.linkText("Extract Data");
            WebElement extract_button = wait.until(ExpectedConditions.visibilityOfElementLocated(extract_name));
            Thread.sleep(2000);
            extract_button.click();
            String regex_options_string = "Regex Options";
            By regex_options_title = By.id("regex_options_title");
            WebElement regex_options = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Extraction page", regex_options_string.equals(regex_options.getText()));

            //checking that the PDF outline sidebar is visible
            By sidebar_title = By.id("sidebar");
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            Thread.sleep(2000);
            assertTrue("PDF sidebar is not visible in Extraction page", driver.findElement(sidebar_title).isDisplayed());
            //clicking PDF outline button and checking if sidebar is not visible
            By pdf_outline_id = By.id("pdf_outline_title");
            WebElement pdf_outline_button = wait.until(ExpectedConditions.visibilityOfElementLocated(pdf_outline_id));
            Thread.sleep(2000);
            pdf_outline_button.click();
            By sidebar_check = By.id("sidebar");
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertFalse("PDF sidebar is visible in Extraction page", driver.findElement(sidebar_check).isDisplayed());

            //Checks regex Options bar is visible via text
            By regex_command_title = By.id("regex_command_title");
            WebElement regex_command = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_command_title));
            String regex_command_string = "Regex Command";
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Regex Options sidebar is not visible in Extraction page", regex_command_string.equals(regex_command.getText()));

            //Click on regex options button and check if regex options bar/regex guide tab is now invisible
            By regex_guide_name = By.className("regex-guide");
            WebElement regex_guide_tab = wait.until(ExpectedConditions.elementToBeClickable(regex_guide_name));
            regex_guide_tab.click();
            By regex_guide_id = By.id("regex_guide");
            WebElement regex_guide = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_guide_id));
            String regex_guide_string = "Regex Guide";
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Regex Guide tab is not visible in Extraction page", regex_guide_string.equals(regex_guide.getText()));
            By regex_options_ttle = By.id("regex_options_title");
            WebElement regex_options_button = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_ttle));
            regex_options_button.click();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertFalse("Regex Options sidebar is visible in Extraction page", regex_command_string.equals(regex_command.getText()));

            //waits for the templates button and then clicks on it, and checks that the templates content appears
            By templates_name = By.id("templates_title");
            WebElement templates_button = wait.until(ExpectedConditions.visibilityOfElementLocated(templates_name));
            Thread.sleep(2000);
            templates_button.click();
            String templates_list_string = "Load templates:";
            By templates_list_title = By.id("loaded_templates_title");
            WebElement templates_list = wait.until(ExpectedConditions.visibilityOfElementLocated(templates_list_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Templates List in Extraction page", templates_list_string.equals(templates_list.getText()));


            
        }catch(Exception e){
            System.out.print(e);
        }
    }
    @After
    public void TearDown(){
        driver.quit();
    }
}
