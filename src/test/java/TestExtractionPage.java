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

public class TestExtractionPage {
    WebDriver driver;
    @Test
    public void startWebDriver() throws InterruptedException{
        driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 100);

        try{
            By extract_name = By.linkText("Extract Data");
            WebElement extract_button = wait.until(ExpectedConditions.visibilityOfElementLocated(extract_name));
            extract_button.click();
            String regex_options_string = "Regex Options";
            By regex_options_title = By.id("regex_options_title");
            WebElement regex_options = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Extraction page", regex_options_string.equals(regex_options.getText()));

            Thread.sleep(2000);
            By templates_name = By.id("templates_title");
            WebElement templates_button = wait.until(ExpectedConditions.visibilityOfElementLocated(templates_name));
            templates_button.click();
            String templates_list_string = "Load templates:";
            By templates_list_title = By.id("loaded_templates_title");
            WebElement templates_list = wait.until(ExpectedConditions.visibilityOfElementLocated(templates_list_title));
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Templates List in Extraction page", templates_list_string.equals(templates_list.getText()));

            //checking that the PDF outline sidebar is visible
            By sidebar_title = By.id("sidebar");
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("PDF sidebar is not visible in Extraction page", driver.findElement(sidebar_title).isDisplayed());
            //clicking PDF outline button and checking if sidebar is not visible
            By pdf_outline_id = By.id("pdf_outline_title");
            WebElement pdf_outline_button = wait.until(ExpectedConditions.visibilityOfElementLocated(pdf_outline_id));
            pdf_outline_button.click();
            By sidebar_check = By.id("sidebar");
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertFalse("PDF sidebar is visible in Extraction page", driver.findElement(sidebar_check).isDisplayed());

            //Check regex Options bar is visible via text
            By regex_command_title = By.id("regex_command_title");
            WebElement regex_command = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_command_title));
            String regex_command_string = "Regex Command";
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Regex Options sidebar is not visible in Extraction page", regex_command_string.equals(regex_command.getText()));
            //Click on regex options button and check if regex options bar is now invisible
            By regex_options_ttle = By.id("regex_options_title");
            WebElement regex_options_button = wait.until(ExpectedConditions.visibilityOfElementLocated(regex_options_ttle));
            regex_options_button.click();
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertFalse("Regex Options sidebar is visible in Extraction page", regex_command_string.equals(regex_command.getText()));

        }catch(Exception e){
            System.out.print(e);
        }
    }
    @After
    public void TearDown(){
        driver.quit();
    }
}
